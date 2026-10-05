//! Local port probing for AI daemons (Ollama, OmniRoute, LM Studio, Jan, ...).
//!
//! This has to live in Rust: the webview cannot `fetch` `http://127.0.0.1:*`
//! without running into CORS, and a plain TCP connect is all we need to know
//! whether something is listening.

use serde::Serialize;
use std::net::{SocketAddr, TcpStream};
use std::time::{Duration, Instant};

const CONNECT_TIMEOUT: Duration = Duration::from_millis(800);
const MAX_PORTS_PER_CALL: usize = 32;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeResult {
    pub port: u16,
    pub online: bool,
    /// Connect time in milliseconds, only set when `online` is true.
    pub latency_ms: Option<u64>,
}

/// Try to open a TCP connection to `127.0.0.1:port`.
pub fn probe_port_blocking(port: u16, timeout: Duration) -> ProbeResult {
    if port == 0 {
        return ProbeResult { port, online: false, latency_ms: None };
    }
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let started = Instant::now();
    match TcpStream::connect_timeout(&addr, timeout) {
        Ok(_) => ProbeResult {
            port,
            online: true,
            // Report at least 1 ms so a loopback connect doesn't read as "0 ms".
            latency_ms: Some((started.elapsed().as_millis() as u64).max(1)),
        },
        Err(_) => ProbeResult { port, online: false, latency_ms: None },
    }
}

/// Validate and de-duplicate the requested ports, preserving order.
pub fn sanitize_ports(ports: Vec<u32>) -> Result<Vec<u16>, String> {
    if ports.is_empty() {
        return Err("No ports to probe.".into());
    }
    if ports.len() > MAX_PORTS_PER_CALL {
        return Err(format!("Too many ports (max {MAX_PORTS_PER_CALL})."));
    }
    let mut out: Vec<u16> = Vec::with_capacity(ports.len());
    for p in ports {
        let port = u16::try_from(p).map_err(|_| format!("Port {p} is out of range (1-65535)."))?;
        if port == 0 {
            return Err("Port 0 is not valid.".into());
        }
        if !out.contains(&port) {
            out.push(port);
        }
    }
    Ok(out)
}

/// Probe several ports concurrently. Results come back in request order.
#[tauri::command]
pub async fn probe_ports(ports: Vec<u32>) -> Result<Vec<ProbeResult>, String> {
    let ports = sanitize_ports(ports)?;
    let handles: Vec<_> = ports
        .into_iter()
        .map(|p| tauri::async_runtime::spawn_blocking(move || probe_port_blocking(p, CONNECT_TIMEOUT)))
        .collect();

    let mut results = Vec::with_capacity(handles.len());
    for h in handles {
        results.push(h.await.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::TcpListener;

    #[test]
    fn open_port_reports_online_with_latency() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let r = probe_port_blocking(port, Duration::from_millis(500));
        assert!(r.online);
        assert!(r.latency_ms.unwrap() >= 1);
        assert_eq!(r.port, port);
    }

    #[test]
    fn closed_port_reports_offline() {
        // Bind to get a free port, then drop the listener so nothing is listening.
        let port = {
            let l = TcpListener::bind("127.0.0.1:0").unwrap();
            l.local_addr().unwrap().port()
        };
        let r = probe_port_blocking(port, Duration::from_millis(500));
        assert!(!r.online);
        assert_eq!(r.latency_ms, None);
    }

    #[test]
    fn port_zero_is_offline() {
        assert!(!probe_port_blocking(0, Duration::from_millis(50)).online);
    }

    #[test]
    fn sanitize_rejects_empty_zero_and_out_of_range() {
        assert!(sanitize_ports(vec![]).is_err());
        assert!(sanitize_ports(vec![0]).is_err());
        assert!(sanitize_ports(vec![70000]).is_err());
        assert!(sanitize_ports((1..=40).collect()).is_err());
    }

    #[test]
    fn sanitize_dedupes_and_keeps_order() {
        assert_eq!(sanitize_ports(vec![8000, 11434, 8000, 1234]).unwrap(), vec![8000, 11434, 1234]);
    }

    #[test]
    fn async_command_returns_results_in_request_order() {
        let open = TcpListener::bind("127.0.0.1:0").unwrap();
        let open_port = open.local_addr().unwrap().port() as u32;
        let closed_port = {
            let l = TcpListener::bind("127.0.0.1:0").unwrap();
            l.local_addr().unwrap().port() as u32
        };
        let res = tauri::async_runtime::block_on(probe_ports(vec![closed_port, open_port])).unwrap();
        assert_eq!(res.len(), 2);
        assert!(!res[0].online);
        assert!(res[1].online);
    }
}
