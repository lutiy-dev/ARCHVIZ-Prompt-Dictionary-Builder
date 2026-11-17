use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::Manager;
use tauri_plugin_shell::{process::{CommandChild, CommandEvent}, ShellExt};

#[derive(Default)]
struct SidecarState {
    child: Mutex<Option<CommandChild>>,
    ready: AtomicBool,
}

#[derive(Clone)]
struct ExecutionCandidate {
    candidate_id: String,
    digest: String,
    graph: serde_json::Value,
    client_id: String,
    port: u16,
    approved_ticket: Option<String>,
    model_count: usize,
    model_selection_verified: bool,
}

#[derive(Default)]
struct ExecutionState {
    candidate: Mutex<Option<ExecutionCandidate>>,
}

fn safe_id(value: &str) -> bool {
    !value.is_empty() && value.len() <= 128 && value.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
}

fn safe_digest(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn fresh_id(prefix: &str) -> String {
    use std::sync::atomic::{AtomicU64, Ordering as AtomicOrdering};
    use std::time::{SystemTime, UNIX_EPOCH};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    let n = COUNTER.fetch_add(1, AtomicOrdering::Relaxed);
    format!("{prefix}_{now:x}_{n:x}")
}

fn local_http_get(port: u16, path: &str, max_read: usize) -> Result<Vec<u8>, String> {
    use std::io::{Read, Write};
    use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream};
    use std::time::Duration;

    let endpoint = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::LOCALHOST, port));
    let mut socket = TcpStream::connect_timeout(&endpoint, Duration::from_millis(450))
        .map_err(|error| error.to_string())?;
    socket.set_read_timeout(Some(Duration::from_millis(1200))).map_err(|error| error.to_string())?;
    socket.set_write_timeout(Some(Duration::from_millis(450))).map_err(|error| error.to_string())?;
    let request = format!(
        "GET {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\nAccept: application/json\r\nAccept-Encoding: identity\r\n\r\n"
    );
    socket.write_all(request.as_bytes()).map_err(|error| error.to_string())?;
    let mut bytes = Vec::new();
    let mut chunk = [0u8; 8192];
    while bytes.len() < max_read {
        match socket.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => {
                if bytes.len() + n > max_read { return Err("RESPONSE_TOO_LARGE".into()); }
                bytes.extend_from_slice(&chunk[..n]);
            }
            Err(error) if matches!(error.kind(), std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut) => break,
            Err(error) => return Err(error.to_string()),
        }
    }
    Ok(bytes)
}

fn decode_chunked_body(mut body: &[u8]) -> Result<Vec<u8>, String> {
    let mut decoded = Vec::new();
    loop {
        let line_end = body.windows(2).position(|w| w == b"\r\n").ok_or("INVALID_CHUNK_HEADER")?;
        let size_line = std::str::from_utf8(&body[..line_end]).map_err(|_| "INVALID_CHUNK_SIZE")?;
        let size_hex = size_line.split(';').next().unwrap_or("").trim();
        let size = usize::from_str_radix(size_hex, 16).map_err(|_| "INVALID_CHUNK_SIZE")?;
        body = &body[line_end + 2..];
        if size == 0 { break; }
        if body.len() < size + 2 || &body[size..size + 2] != b"\r\n" { return Err("INVALID_CHUNK_BODY".into()); }
        decoded.extend_from_slice(&body[..size]);
        body = &body[size + 2..];
    }
    Ok(decoded)
}

fn local_http_json(port: u16, path: &str, max_read: usize) -> Result<serde_json::Value, String> {
    let raw = local_http_get(port, path, max_read)?;
    let split = raw.windows(4).position(|w| w == b"\r\n\r\n").ok_or("INVALID_HTTP_RESPONSE")?;
    let header_bytes = &raw[..split];
    let mut body = &raw[split + 4..];
    let headers = String::from_utf8_lossy(header_bytes);
    let mut lines = headers.lines();
    let status = lines.next().unwrap_or("");
    if !(status.starts_with("HTTP/1.1 200 ") || status.starts_with("HTTP/1.0 200 ")) {
        return Err("HTTP_NOT_200".into());
    }
    let header_lower = headers.to_ascii_lowercase();
    let owned;
    if header_lower.contains("transfer-encoding: chunked") {
        owned = decode_chunked_body(body)?;
        body = &owned;
    }
    serde_json::from_slice(body).map_err(|_| "INVALID_JSON_RESPONSE".into())
}

fn local_http_post_json(port: u16, path: &str, payload: &serde_json::Value, max_read: usize) -> Result<serde_json::Value, String> {
    use std::io::{Read, Write};
    use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream};
    use std::time::Duration;

    let endpoint = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::LOCALHOST, port));
    let mut socket = TcpStream::connect_timeout(&endpoint, Duration::from_millis(700))
        .map_err(|error| error.to_string())?;
    socket.set_read_timeout(Some(Duration::from_secs(10))).map_err(|error| error.to_string())?;
    socket.set_write_timeout(Some(Duration::from_secs(3))).map_err(|error| error.to_string())?;
    let body = serde_json::to_vec(payload).map_err(|_| "INVALID_REQUEST_JSON")?;
    let request = format!(
        "POST {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\nContent-Type: application/json\r\nAccept: application/json\r\nAccept-Encoding: identity\r\nContent-Length: {}\r\n\r\n",
        body.len()
    );
    socket.write_all(request.as_bytes()).map_err(|error| error.to_string())?;
    socket.write_all(&body).map_err(|error| error.to_string())?;

    let mut raw = Vec::new();
    let mut chunk = [0u8; 8192];
    while raw.len() < max_read {
        match socket.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => {
                if raw.len() + n > max_read { return Err("RESPONSE_TOO_LARGE".into()); }
                raw.extend_from_slice(&chunk[..n]);
            }
            Err(error) if matches!(error.kind(), std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut) => break,
            Err(error) => return Err(error.to_string()),
        }
    }
    let split = raw.windows(4).position(|w| w == b"\r\n\r\n").ok_or("INVALID_HTTP_RESPONSE")?;
    let header_bytes = &raw[..split];
    let mut response_body = &raw[split + 4..];
    let headers = String::from_utf8_lossy(header_bytes);
    let status = headers.lines().next().unwrap_or("");
    if !(status.starts_with("HTTP/1.1 200 ") || status.starts_with("HTTP/1.0 200 ")) {
        return Err("HTTP_NOT_200".into());
    }
    let header_lower = headers.to_ascii_lowercase();
    let owned;
    if header_lower.contains("transfer-encoding: chunked") {
        owned = decode_chunked_body(response_body)?;
        response_body = &owned;
    }
    serde_json::from_slice(response_body).map_err(|_| "INVALID_JSON_RESPONSE".into())
}

fn verify_execution_graph(graph: &serde_json::Value, object_info: &serde_json::Value) -> Result<(usize, bool), String> {
    let nodes = graph.as_object().ok_or("INVALID_API_PROMPT")?;
    if nodes.is_empty() { return Err("INVALID_API_PROMPT".into()); }
    let inventory = object_info.as_object().ok_or("INVALID_OBJECT_INFO")?;
    let mut model_count = 0usize;
    let model_keys = ["ckpt_name","lora_name","vae_name","unet_name","clip_name","control_net_name","model_name","upscale_model_name","style_model_name"];
    for node in nodes.values() {
        let class_type = node.get("class_type").and_then(|v| v.as_str()).ok_or("NODE_CLASS_TYPE_REQUIRED")?;
        let definition = inventory.get(class_type).ok_or_else(|| format!("UNKNOWN_NODE:{class_type}"))?;
        let inputs = node.get("inputs").and_then(|v| v.as_object()).ok_or("NODE_INPUTS_REQUIRED")?;
        for (key, value) in inputs {
            if !model_keys.iter().any(|known| known.eq_ignore_ascii_case(key)) || !value.is_string() { continue; }
            let selected = value.as_str().unwrap_or("");
            let input_defs = definition.get("input").and_then(|v| v.as_object()).ok_or_else(|| format!("MISSING_INPUT_CONTRACT:{class_type}"))?;
            let descriptor = input_defs.get("required").and_then(|v| v.get(key))
                .or_else(|| input_defs.get("optional").and_then(|v| v.get(key)))
                .ok_or_else(|| format!("MODEL_INPUT_NOT_DECLARED:{class_type}.{key}"))?;
            let parts = descriptor.as_array().ok_or_else(|| format!("MODEL_CHOICES_UNAVAILABLE:{class_type}.{key}"))?;
            let choices = if let Some(list) = parts.first().and_then(|v| v.as_array()) {
                Some(list)
            } else if parts.first().and_then(|v| v.as_str()) == Some("COMBO") {
                parts.get(1).and_then(|v| v.get("options")).and_then(|v| v.as_array())
            } else { None }.ok_or_else(|| format!("MODEL_CHOICES_UNAVAILABLE:{class_type}.{key}"))?;
            if !choices.iter().any(|choice| choice.as_str() == Some(selected)) {
                return Err(format!("MODEL_NOT_IN_CURRENT_INVENTORY:{class_type}.{key}"));
            }
            model_count += 1;
        }
    }
    Ok((model_count, model_count > 0))
}

fn http_probe_comfyui(port: u16) -> bool {
    let stats = match local_http_json(port, "/system_stats", 256 * 1024) {
        Ok(value) => value,
        Err(_) => return false,
    };
    let stats_ok = stats.get("system").is_some() && stats.get("devices").is_some();
    if !stats_ok { return false; }
    matches!(local_http_json(port, "/object_info", 16 * 1024 * 1024), Ok(serde_json::Value::Object(_)))
}

#[cfg(target_os = "windows")]
fn local_listening_ports() -> Vec<u16> {
    use std::process::Command;
    let output = match Command::new("netstat").args(["-ano", "-p", "tcp"]).output() {
        Ok(value) if value.status.success() => value,
        _ => return Vec::new(),
    };
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut ports = Vec::new();
    for line in stdout.lines() {
        let cols: Vec<_> = line.split_whitespace().collect();
        if cols.len() < 4 || cols[0] != "TCP" || cols[3] != "LISTENING" { continue; }
        let local = cols[1];
        let host_is_local = local.starts_with("127.0.0.1:")
            || local.starts_with("0.0.0.0:")
            || local.starts_with("[::1]:")
            || local.starts_with("[::]:");
        if !host_is_local { continue; }
        if let Some(raw) = local.rsplit(':').next() {
            if let Ok(port) = raw.parse::<u16>() {
                if port > 0 && !ports.contains(&port) { ports.push(port); }
            }
        }
    }
    ports
}

#[cfg(not(target_os = "windows"))]
fn local_listening_ports() -> Vec<u16> { Vec::new() }

fn comfyui_report(port: u16, method: &str) -> serde_json::Value {
    let connected = http_probe_comfyui(port);
    serde_json::json!({
        "status": if connected { "CONNECTED_UNVERIFIED" } else { "DISCONNECTED" },
        "origin": format!("http://127.0.0.1:{port}"),
        "port": port,
        "detection_method": method,
        "api_verified": connected,
        "execution_allowed": false
    })
}

#[tauri::command]
fn comfyui_health() -> serde_json::Value {
    comfyui_report(8188, "LEGACY_FIXED_8188")
}

#[tauri::command]
fn comfyui_probe_port(port: u16) -> serde_json::Value {
    if port == 0 { return serde_json::json!({
        "status":"BLOCKED","reason":"INVALID_PORT","execution_allowed":false
    }); }
    comfyui_report(port, "MANUAL_LOOPBACK_API_VERIFY")
}

#[tauri::command]
fn comfyui_object_info(port: u16) -> serde_json::Value {
    if port == 0 {
        return serde_json::json!({"status":"BLOCKED","reason":"INVALID_PORT","execution_allowed":false});
    }
    match local_http_json(port, "/object_info", 16 * 1024 * 1024) {
        Ok(serde_json::Value::Object(map)) => {
            let node_count = map.len();
            serde_json::json!({
                "status":"OBJECT_INFO_READY",
                "port":port,
                "node_count":node_count,
                "object_info":serde_json::Value::Object(map),
                "network_used":false,
                "execution_allowed":false
            })
        }
        Ok(_) => serde_json::json!({"status":"BLOCKED","reason":"INVALID_OBJECT_INFO","execution_allowed":false}),
        Err(reason) => serde_json::json!({"status":"BLOCKED","reason":reason,"execution_allowed":false})
    }
}

#[tauri::command]
fn comfyui_discover() -> serde_json::Value {
    let mut candidates = vec![8000u16, 8188u16];
    for port in local_listening_ports() {
        if !candidates.contains(&port) { candidates.push(port); }
    }
    let mut checked = Vec::new();
    for port in candidates.into_iter().take(96) {
        checked.push(port);
        if http_probe_comfyui(port) {
            return serde_json::json!({
                "status":"CONNECTED_UNVERIFIED",
                "origin":format!("http://127.0.0.1:{port}"),
                "port":port,
                "detection_method":"LOOPBACK_LISTENER_API_VERIFIED",
                "api_verified":true,
                "checked_ports":checked,
                "execution_allowed":false
            });
        }
    }
    serde_json::json!({
        "status":"DISCONNECTED",
        "reason":"NO_LOCAL_COMFYUI_API_FOUND",
        "checked_ports":checked,
        "execution_allowed":false
    })
}

#[tauri::command]
fn comfyui_execution_stage(
    port: u16,
    graph: serde_json::Value,
    digest: String,
    client_id: String,
    filename: String,
    state: tauri::State<'_, ExecutionState>,
) -> serde_json::Value {
    if port == 0 || !safe_digest(&digest) || !safe_id(&client_id) || filename.is_empty() || filename.len() > 240 {
        return serde_json::json!({"status":"BLOCKED","reason":"INVALID_STAGE_REQUEST"});
    }
    let object_info = match local_http_json(port, "/object_info", 16 * 1024 * 1024) {
        Ok(value) => value,
        Err(reason) => return serde_json::json!({"status":"BLOCKED","reason":reason}),
    };
    let (model_count, model_selection_verified) = match verify_execution_graph(&graph, &object_info) {
        Ok(value) => value,
        Err(reason) => return serde_json::json!({"status":"BLOCKED","reason":reason}),
    };
    let node_count = graph.as_object().map(|v| v.len()).unwrap_or(0);
    let candidate_id = fresh_id("candidate");
    let candidate = ExecutionCandidate {
        candidate_id: candidate_id.clone(),
        digest: digest.clone(),
        graph,
        client_id,
        port,
        approved_ticket: None,
        model_count,
        model_selection_verified,
    };
    match state.candidate.lock() {
        Ok(mut slot) => *slot = Some(candidate),
        Err(_) => return serde_json::json!({"status":"BLOCKED","reason":"EXECUTION_STATE_LOCK_FAILED"}),
    }
    serde_json::json!({
        "status":"READY_FOR_HUMAN_APPROVAL",
        "candidate_id":candidate_id,
        "digest":digest,
        "node_count":node_count,
        "model_count":model_count,
        "model_selection_verified":model_selection_verified,
        "geometry_verified":false,
        "queued":false
    })
}

#[tauri::command]
fn comfyui_execution_approve(
    candidate_id: String,
    digest: String,
    user_confirmed: bool,
    state: tauri::State<'_, ExecutionState>,
) -> serde_json::Value {
    if !user_confirmed || !safe_id(&candidate_id) || !safe_digest(&digest) {
        return serde_json::json!({"status":"BLOCKED","reason":"EXACT_GRAPH_USER_APPROVAL_REQUIRED"});
    }
    let mut slot = match state.candidate.lock() {
        Ok(value) => value,
        Err(_) => return serde_json::json!({"status":"BLOCKED","reason":"EXECUTION_STATE_LOCK_FAILED"}),
    };
    let candidate = match slot.as_mut() {
        Some(value) if value.candidate_id == candidate_id && value.digest == digest => value,
        _ => return serde_json::json!({"status":"BLOCKED","reason":"STAGED_CANDIDATE_MISMATCH"}),
    };
    let ticket = fresh_id("ticket");
    candidate.approved_ticket = Some(ticket.clone());
    serde_json::json!({"status":"APPROVED_FOR_ONE_QUEUE","ticket":ticket,"digest":digest})
}

#[tauri::command]
fn comfyui_execution_queue(ticket: String, state: tauri::State<'_, ExecutionState>) -> serde_json::Value {
    if !safe_id(&ticket) { return serde_json::json!({"status":"BLOCKED","reason":"APPROVED_TICKET_REQUIRED"}); }
    let (graph, client_id, port, digest, model_count, model_selection_verified) = {
        let mut slot = match state.candidate.lock() {
            Ok(value) => value,
            Err(_) => return serde_json::json!({"status":"BLOCKED","reason":"EXECUTION_STATE_LOCK_FAILED"}),
        };
        let candidate = match slot.as_mut() {
            Some(value) if value.approved_ticket.as_deref() == Some(ticket.as_str()) => value,
            _ => return serde_json::json!({"status":"BLOCKED","reason":"APPROVED_TICKET_REQUIRED"}),
        };
        candidate.approved_ticket = None;
        (
            candidate.graph.clone(),
            candidate.client_id.clone(),
            candidate.port,
            candidate.digest.clone(),
            candidate.model_count,
            candidate.model_selection_verified,
        )
    };
    let payload = serde_json::json!({"prompt":graph,"client_id":client_id});
    let response = match local_http_post_json(port, "/prompt", &payload, 1024 * 1024) {
        Ok(value) => value,
        Err(reason) => return serde_json::json!({"status":"BLOCKED","reason":reason,"retry_requires_new_approval":true}),
    };
    let prompt_id = match response.get("prompt_id").and_then(|v| v.as_str()) {
        Some(value) if safe_id(value) => value.to_owned(),
        _ => return serde_json::json!({"status":"BLOCKED","reason":"INVALID_PROMPT_ID","retry_requires_new_approval":true}),
    };
    serde_json::json!({
        "status":"QUEUED_UNVERIFIED",
        "prompt_id":prompt_id,
        "digest":digest,
        "model_count":model_count,
        "model_selection_verified":model_selection_verified,
        "geometry_verified":false
    })
}

#[tauri::command]
fn comfyui_execution_history(port: u16, prompt_id: String) -> serde_json::Value {
    if port == 0 || !safe_id(&prompt_id) {
        return serde_json::json!({"status":"BLOCKED","reason":"INVALID_HISTORY_REQUEST"});
    }
    let path = format!("/history/{}", prompt_id);
    match local_http_json(port, &path, 16 * 1024 * 1024) {
        Ok(history) => serde_json::json!({
            "status":"HISTORY_RECEIVED_UNREVIEWED",
            "prompt_id":prompt_id,
            "history":history,
            "geometry_verified":false
        }),
        Err(reason) => serde_json::json!({"status":"BLOCKED","reason":reason})
    }
}

#[tauri::command]
fn desktop_status(state: tauri::State<'_, SidecarState>) -> serde_json::Value {
    serde_json::json!({
        "runtime": "TAURI_2_LAB",
        "mcp_ready": state.ready.load(Ordering::Acquire),
        "comfyui_connected": false,
        "openai_connected": false,
        "external_execution_enabled": false,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState::default())
        .manage(ExecutionState::default())
        .invoke_handler(tauri::generate_handler![desktop_status, comfyui_health, comfyui_probe_port, comfyui_discover, comfyui_object_info, comfyui_execution_stage, comfyui_execution_approve, comfyui_execution_queue, comfyui_execution_history])
        .setup(|app| {
            let (mut events, mut child) = app.shell().sidecar("ovizlab-mcp")?.spawn()?;
            // Private stdio only. No local HTTP listener, no shell permission to WebView.
            child.write(b"{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"ovizlab-desktop\",\"version\":\"0.1.0\"}}}\n")?;
            child.write(b"{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n")?;
            child.write(b"{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}\n")?;
            {
                let state = app.state::<SidecarState>();
                let mut lock = state.child.lock().map_err(|_| "Sidecar lock poisoned")?;
                *lock = Some(child);
            }
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut buffer = String::new();
                let mut init_ok = false;
                while let Some(event) = events.recv().await {
                    match event {
                        CommandEvent::Stdout(bytes) => {
                            buffer.push_str(&String::from_utf8_lossy(&bytes));
                            if buffer.len() > 131072 { break; }
                            while let Some(pos) = buffer.find('\n') {
                                let line = buffer[..pos].to_owned();
                                buffer.drain(..=pos);
                                if let Ok(data) = serde_json::from_str::<serde_json::Value>(&line) {
                                    if data["id"] == 1 && data["result"]["serverInfo"]["name"] == "ovizlab-mcp-native" {
                                        init_ok = true;
                                    }
                                    if data["id"] == 2 && init_ok && data["result"]["tools"].as_array()
                                        .is_some_and(|tools| tools.len() == 1 && tools[0]["name"] == "runtime_info") {
                                        handle.state::<SidecarState>().ready.store(true, Ordering::Release);
                                    }
                                }
                            }
                        }
                        CommandEvent::Terminated(_) => break,
                        _ => {}
                    }
                }
                handle.state::<SidecarState>().ready.store(false, Ordering::Release);
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::Destroyed) {
                let state = window.app_handle().state::<SidecarState>();
                state.ready.store(false, Ordering::Release);
                let owned_child = match state.child.lock() {
                    Ok(mut guard) => guard.take(),
                    Err(_) => None,
                };
                if let Some(child) = owned_child { let _ = child.kill(); }
            }
        })
        .run(tauri::generate_context!())
        .expect("Tauri runtime failed");
}
