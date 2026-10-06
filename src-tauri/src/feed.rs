//! Download of the optional remote data feed (public JSON in a GitHub repo).
//!
//! The webview can't `fetch` arbitrary hosts (CORS), so the download happens here. This side only
//! limits what is fetched (HTTPS, size, time); the frontend validates the content before using it.

use std::time::Duration;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
/// Largest feed accepted. The built-in provider data is a few tens of KB.
const MAX_FEED_BYTES: usize = 1024 * 1024;

/// Only HTTPS is allowed, plus plain HTTP to this machine so a feed can be tried locally.
pub fn validate_feed_url(raw: &str) -> Result<reqwest::Url, String> {
    let url = reqwest::Url::parse(raw.trim()).map_err(|_| "The feed address is not a valid URL.".to_string())?;
    let local = matches!(url.host_str(), Some("localhost") | Some("127.0.0.1") | Some("[::1]"));
    match url.scheme() {
        "https" => {}
        "http" if local => {}
        _ => return Err("The feed address must start with https://.".to_string()),
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("The feed address must not contain a username or password.".to_string());
    }
    Ok(url)
}

/// Fail early when a server announces a body larger than the limit.
pub fn check_declared_size(content_length: Option<u64>) -> Result<(), String> {
    match content_length {
        Some(len) if len > MAX_FEED_BYTES as u64 => Err(too_large()),
        _ => Ok(()),
    }
}

fn too_large() -> String {
    format!("The feed is larger than {} KB, so it was ignored.", MAX_FEED_BYTES / 1024)
}

/// Download the feed and return its text. Every failure comes back as a readable message.
#[tauri::command]
pub async fn fetch_feed(url: String) -> Result<String, String> {
    let result = download(&url).await;
    match &result {
        Ok(body) => crate::applog::info("feed", &format!("Downloaded {} bytes from {}", body.len(), url.trim())),
        Err(message) => crate::applog::warn("feed", &format!("{message} ({})", url.trim())),
    }
    result
}

async fn download(url: &str) -> Result<String, String> {
    let url = validate_feed_url(url)?;

    // Follow redirects (GitHub raw links sometimes redirect) but never off HTTPS.
    let policy = reqwest::redirect::Policy::custom(|attempt| {
        if attempt.previous().len() >= 3 || attempt.url().scheme() != "https" {
            attempt.stop()
        } else {
            attempt.follow()
        }
    });
    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .redirect(policy)
        .user_agent("LocalMind")
        .build()
        .map_err(|e| format!("Could not start the download: {e}"))?;

    let mut response = client
        .get(url)
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "The feed server did not answer in time.".to_string()
            } else {
                "Could not reach the feed server. Check your connection.".to_string()
            }
        })?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("The feed server answered HTTP {}.", status.as_u16()));
    }
    check_declared_size(response.content_length())?;

    let mut body: Vec<u8> = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "The download was interrupted.".to_string())? {
        if body.len() + chunk.len() > MAX_FEED_BYTES {
            return Err(too_large());
        }
        body.extend_from_slice(&chunk);
    }
    String::from_utf8(body).map_err(|_| "The feed is not valid text.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_https_and_local_http_only() {
        assert!(validate_feed_url("https://raw.githubusercontent.com/o/r/main/feed/providers.json").is_ok());
        assert!(validate_feed_url("  https://example.com/feed.json  ").is_ok());
        assert!(validate_feed_url("http://localhost:8080/feed.json").is_ok());
        assert!(validate_feed_url("http://127.0.0.1/feed.json").is_ok());
        assert!(validate_feed_url("http://example.com/feed.json").is_err());
        assert!(validate_feed_url("ftp://example.com/feed.json").is_err());
        assert!(validate_feed_url("file:///C:/feed.json").is_err());
        assert!(validate_feed_url("not a url").is_err());
        assert!(validate_feed_url("").is_err());
    }

    #[test]
    fn rejects_credentials_in_the_url() {
        assert!(validate_feed_url("https://user:pass@example.com/feed.json").is_err());
        assert!(validate_feed_url("https://user@example.com/feed.json").is_err());
    }

    #[test]
    fn rejects_an_announced_oversized_body() {
        assert!(check_declared_size(None).is_ok());
        assert!(check_declared_size(Some(1024)).is_ok());
        assert!(check_declared_size(Some(MAX_FEED_BYTES as u64)).is_ok());
        assert!(check_declared_size(Some(MAX_FEED_BYTES as u64 + 1)).is_err());
    }

    // ---- The real download path, against a throwaway server on loopback ----

    use std::io::{Read, Write};
    use std::net::TcpListener;

    /// Serve one canned HTTP response and return the URL to fetch it from.
    fn serve_once(response: Vec<u8>) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        std::thread::spawn(move || {
            if let Ok((mut stream, _)) = listener.accept() {
                let mut buf = [0u8; 2048];
                let _ = stream.read(&mut buf);
                // The client may hang up early (size limit); that is fine.
                let _ = stream.write_all(&response);
            }
        });
        format!("http://127.0.0.1:{port}/feed.json")
    }

    fn http(status: &str, headers: &str, body: &[u8]) -> Vec<u8> {
        let mut out = format!("HTTP/1.1 {status}\r\n{headers}Connection: close\r\n\r\n").into_bytes();
        out.extend_from_slice(body);
        out
    }

    fn fetch(url: String) -> Result<String, String> {
        tauri::async_runtime::block_on(fetch_feed(url))
    }

    #[test]
    fn downloads_a_feed() {
        let body = br#"{"schema":1}"#;
        let url = serve_once(http("200 OK", &format!("Content-Length: {}\r\n", body.len()), body));
        assert_eq!(fetch(url).unwrap(), r#"{"schema":1}"#);
    }

    #[test]
    fn reports_an_http_error_status() {
        let url = serve_once(http("404 Not Found", "Content-Length: 0\r\n", b""));
        let err = fetch(url).unwrap_err();
        assert!(err.contains("404"), "{err}");
    }

    #[test]
    fn stops_an_oversized_download_with_or_without_a_declared_length() {
        let big = vec![b'a'; MAX_FEED_BYTES + 10];
        let declared = serve_once(http("200 OK", &format!("Content-Length: {}\r\n", big.len()), &big));
        assert!(fetch(declared).unwrap_err().contains("larger"));
        let undeclared = serve_once(http("200 OK", "", &big));
        assert!(fetch(undeclared).unwrap_err().contains("larger"));
    }

    #[test]
    fn does_not_follow_a_redirect_to_plain_http() {
        let url = serve_once(http("302 Found", "Location: http://example.com/feed.json\r\nContent-Length: 0\r\n", b""));
        let err = fetch(url).unwrap_err();
        assert!(err.contains("302"), "{err}");
    }

    #[test]
    fn rejects_a_body_that_is_not_text() {
        let body = [0xff, 0xfe, 0xfd];
        let url = serve_once(http("200 OK", &format!("Content-Length: {}\r\n", body.len()), &body));
        assert!(fetch(url).unwrap_err().contains("not valid text"));
    }

    #[test]
    fn reports_an_unreachable_server_and_a_bad_address() {
        // Nothing listens on port 1.
        assert!(fetch("http://127.0.0.1:1/feed.json".to_string()).unwrap_err().contains("Could not reach"));
        assert!(fetch("http://example.com/feed.json".to_string()).unwrap_err().contains("https://"));
    }
}
