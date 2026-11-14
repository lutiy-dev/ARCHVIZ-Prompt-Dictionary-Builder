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

#[tauri::command]
fn comfyui_health() -> serde_json::Value {
    use std::io::{Read, Write};
    use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream};
    use std::time::Duration;
    let endpoint = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 8188));
    let status = (|| -> std::io::Result<bool> {
        let mut socket = TcpStream::connect_timeout(&endpoint, Duration::from_secs(2))?;
        socket.set_read_timeout(Some(Duration::from_secs(2)))?;
        socket.set_write_timeout(Some(Duration::from_secs(2)))?;
        socket.write_all(b"GET /system_stats HTTP/1.1\r\nHost: 127.0.0.1:8188\r\nConnection: close\r\n\r\n")?;
        let mut buf = [0u8; 512];
        let n = socket.read(&mut buf)?;
        let response = String::from_utf8_lossy(&buf[..n]);
        Ok(response.starts_with("HTTP/1.1 200 ") || response.starts_with("HTTP/1.0 200 "))
    })();
    serde_json::json!({
        "status": if status.unwrap_or(false) { "CONNECTED_UNVERIFIED" } else { "DISCONNECTED" },
        "origin": "http://127.0.0.1:8188",
        "execution_allowed": false
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
        .invoke_handler(tauri::generate_handler![desktop_status, comfyui_health])
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
