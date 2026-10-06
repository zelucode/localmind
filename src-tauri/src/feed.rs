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
    let url = validate_feed_url(&url)?;

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
}
