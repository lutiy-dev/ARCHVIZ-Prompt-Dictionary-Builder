use std::io::{self, BufRead, Write};
use serde_json::{json, Value};

fn reply(packet: &Value) -> Option<Value> {
    let method = packet.get("method")?.as_str()?;
    let id = packet.get("id")?.clone();
    let result = match method {
        "initialize" => json!({
            "protocolVersion": "2025-06-18",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "ovizlab-mcp-native", "version": "0.1.0"}
        }),
        "ping" => json!({}),
        "tools/list" => json!({"tools": [{
            "name": "runtime_info",
            "description": "Read-only native MCP runtime status; no external execution",
            "inputSchema": {"type":"object","properties":{},"additionalProperties":false}
        }]}),
        "tools/call" => {
            if packet["params"]["name"] != "runtime_info" || !packet["params"]["arguments"].as_object().is_some_and(|a| a.is_empty()) {
                return Some(json!({"jsonrpc":"2.0","id":id,"error":{"code":-32602,"message":"Unknown or disallowed tool"}}));
            }
            json!({"content":[{"type":"text","text":"{\"status\":\"LAB\",\"external_execution_enabled\":false}"}],"isError":false})
        }
        _ => return Some(json!({"jsonrpc":"2.0","id":id,"error":{"code":-32601,"message":"Unknown method"}}))
    };
    Some(json!({"jsonrpc":"2.0","id":id,"result":result}))
}

fn main() {
    for line in io::stdin().lock().lines() {
        let Ok(line) = line else { break };
        if line.len() > 1_000_000 { break; }
        let response = serde_json::from_str::<Value>(&line).ok().and_then(|packet| reply(&packet));
        if let Some(response) = response {
            let mut out = io::stdout().lock();
            if writeln!(out, "{}", response).is_err() || out.flush().is_err() { break; }
        }
    }
}
