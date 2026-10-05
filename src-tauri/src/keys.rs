//! API key verification against each provider's lightweight "list models" endpoint.
//!
//! Keys are sent only to the provider they belong to, over HTTPS, in a header
//! (never in the URL, so they don't end up in logs).

use serde::{Deserialize, Serialize};
use std::time::Duration;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum VerifyStatus {
    /// The provider accepted the key.
    Valid,
    /// The provider rejected the key.
    Invalid,
    /// We could not reach a verdict (network error, rate limit, server error).
    Error,
    /// This provider has no verification endpoint we know of.
    Unsupported,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyResult {
    pub status: VerifyStatus,
    pub message: String,
}

impl VerifyResult {
    fn new(status: VerifyStatus, message: impl Into<String>) -> Self {
        Self { status, message: message.into() }
    }
}

#[derive(Debug, Deserialize)]
pub struct VerifyRequest {
    pub provider: String,
    pub key: String,
}

/// How to call a provider: URL plus the headers that carry the key.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestSpec {
    pub url: &'static str,
    pub headers: Vec<(&'static str, String)>,
}

/// Build the verification request for a provider, or `None` if unsupported.
pub fn request_spec(provider: &str, key: &str) -> Option<RequestSpec> {
    let bearer = || ("authorization", format!("Bearer {key}"));
    match provider {
        "gemini" => Some(RequestSpec {
            url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
            headers: vec![("x-goog-api-key", key.to_string())],
        }),
        "openrouter" => Some(RequestSpec {
            // /models is public; /auth/key actually checks the key.
            url: "https://openrouter.ai/api/v1/auth/key",
            headers: vec![bearer()],
        }),
        "groq" => Some(RequestSpec { url: "https://api.groq.com/openai/v1/models", headers: vec![bearer()] }),
        "openai" => Some(RequestSpec { url: "https://api.openai.com/v1/models", headers: vec![bearer()] }),
        "deepseek" => Some(RequestSpec { url: "https://api.deepseek.com/models", headers: vec![bearer()] }),
        "mistral" => Some(RequestSpec { url: "https://api.mistral.ai/v1/models", headers: vec![bearer()] }),
        "anthropic" => Some(RequestSpec {
            url: "https://api.anthropic.com/v1/models",
            headers: vec![("x-api-key", key.to_string()), ("anthropic-version", "2023-06-01".to_string())],
        }),
        _ => None,
    }
}

/// Turn an HTTP status into a verdict. Gemini reports bad keys as 400, most others as 401/403.
pub fn classify_status(provider: &str, http_status: u16) -> VerifyResult {
    match http_status {
        200..=299 => VerifyResult::new(VerifyStatus::Valid, "Key accepted by the provider."),
        401 | 403 => VerifyResult::new(VerifyStatus::Invalid, "The provider rejected this key."),
        400 if provider == "gemini" => VerifyResult::new(VerifyStatus::Invalid, "The provider rejected this key."),
        429 => VerifyResult::new(
            VerifyStatus::Error,
            "Rate limited by the provider. The key may be fine; try again in a minute.",
        ),
        500..=599 => VerifyResult::new(VerifyStatus::Error, "The provider returned a server error. Try again later."),
        other => VerifyResult::new(VerifyStatus::Error, format!("Unexpected response from the provider (HTTP {other}).")),
    }
}

/// Reject obviously unusable input before it goes anywhere near a request header.
pub fn validate_key_input(key: &str) -> Result<(), String> {
    let key = key.trim();
    if key.is_empty() {
        return Err("The key is empty.".into());
    }
    if key.len() > 512 {
        return Err("The key is unreasonably long.".into());
    }
    if key.chars().any(|c| c.is_control() || c.is_whitespace()) {
        return Err("The key contains whitespace or control characters.".into());
    }
    Ok(())
}

#[tauri::command]
pub async fn verify_api_key(request: VerifyRequest) -> VerifyResult {
    let key = request.key.trim().to_string();
    if let Err(msg) = validate_key_input(&key) {
        return VerifyResult::new(VerifyStatus::Invalid, msg);
    }
    let Some(spec) = request_spec(&request.provider, &key) else {
        return VerifyResult::new(
            VerifyStatus::Unsupported,
            "Verification isn't available for this provider yet. The key has not been checked.",
        );
    };

    let client = match reqwest::Client::builder().timeout(REQUEST_TIMEOUT).build() {
        Ok(c) => c,
        Err(e) => return VerifyResult::new(VerifyStatus::Error, format!("Could not start the request: {e}")),
    };
    let mut req = client.get(spec.url);
    for (name, value) in &spec.headers {
        req = req.header(*name, value);
    }
    match req.send().await {
        Ok(resp) => classify_status(&request.provider, resp.status().as_u16()),
        Err(e) if e.is_timeout() => VerifyResult::new(VerifyStatus::Error, "The provider did not respond in time."),
        Err(_) => VerifyResult::new(VerifyStatus::Error, "Could not reach the provider. Check your internet connection."),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_known_provider_has_a_request_spec_with_the_key_in_a_header() {
        for p in ["gemini", "openrouter", "groq", "openai", "deepseek", "mistral", "anthropic"] {
            let spec = request_spec(p, "secret-key-123").unwrap_or_else(|| panic!("{p} missing"));
            assert!(spec.url.starts_with("https://"), "{p} must use https");
            assert!(!spec.url.contains("secret-key-123"), "{p} must not put the key in the URL");
            assert!(
                spec.headers.iter().any(|(_, v)| v.contains("secret-key-123")),
                "{p} must send the key in a header"
            );
        }
    }

    #[test]
    fn unknown_provider_is_unsupported() {
        assert!(request_spec("other", "k").is_none());
        assert!(request_spec("", "k").is_none());
    }

    #[test]
    fn classifies_http_statuses() {
        assert_eq!(classify_status("groq", 200).status, VerifyStatus::Valid);
        assert_eq!(classify_status("groq", 401).status, VerifyStatus::Invalid);
        assert_eq!(classify_status("groq", 403).status, VerifyStatus::Invalid);
        assert_eq!(classify_status("gemini", 400).status, VerifyStatus::Invalid);
        assert_eq!(classify_status("groq", 400).status, VerifyStatus::Error);
        assert_eq!(classify_status("openai", 429).status, VerifyStatus::Error);
        assert_eq!(classify_status("openai", 503).status, VerifyStatus::Error);
        assert_eq!(classify_status("openai", 302).status, VerifyStatus::Error);
    }

    #[test]
    fn validates_key_input() {
        assert!(validate_key_input("AIzaSyExampleKey123").is_ok());
        assert!(validate_key_input("   ").is_err());
        assert!(validate_key_input("has space").is_err());
        assert!(validate_key_input("new\nline").is_err());
        assert!(validate_key_input(&"a".repeat(513)).is_err());
    }

    #[test]
    fn unsupported_provider_command_does_not_hit_the_network() {
        let res = tauri::async_runtime::block_on(verify_api_key(VerifyRequest {
            provider: "other".into(),
            key: "abcdefghijk".into(),
        }));
        assert_eq!(res.status, VerifyStatus::Unsupported);
    }

    #[test]
    fn empty_key_is_invalid_without_network() {
        let res = tauri::async_runtime::block_on(verify_api_key(VerifyRequest {
            provider: "gemini".into(),
            key: "  ".into(),
        }));
        assert_eq!(res.status, VerifyStatus::Invalid);
    }
}
