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
        .invoke_handler(tauri::generate_handler![desktop_status, comfyui_health, comfyui_probe_port, comfyui_discover, comfyui_object_info])
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
