//! "Free Tier Advisor": asks Gemini how to solve a task with free AI tools.
//!
//! The user's own Gemini key (from the Key Vault) is used; nothing is proxied
//! through any LocalMind server.

use serde::Deserialize;
use serde_json::{json, Value};
use std::time::Duration;

const MODEL: &str = "gemini-2.5-flash";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(45);
const MAX_QUERY_CHARS: usize = 2000;

const SYSTEM_PROMPT: &str = "You are the LocalMind Free Tier Advisor. Recommend ways to solve the user's task using \
only free AI tools: web chat apps (Perplexity, ChatGPT, Claude, DeepSeek, Gemini, Mistral), coding agents and IDE \
extensions (Cline, Continue, Cursor, Aider, Windsurf), free API tiers (Google AI Studio, Groq, OpenRouter free models) \
and local runners (Ollama, LM Studio, Jan, OmniRoute). Be concrete and concise. Always say whether a tool can edit \
local files or only runs in the cloud. Use short markdown with bullet points. Do not invent pricing or limits; if \
unsure, say so.";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvisorRequest {
    pub query: String,
    /// The user's Gemini API key from the vault.
    pub api_key: String,
}

pub fn validate_query(query: &str) -> Result<String, String> {
    let q = query.trim();
    if q.is_empty() {
        return Err("Type a question first.".into());
    }
    if q.chars().count() > MAX_QUERY_CHARS {
        return Err(format!("Question is too long (max {MAX_QUERY_CHARS} characters)."));
    }
    Ok(q.to_string())
}

pub fn build_body(query: &str) -> Value {
    json!({
        "systemInstruction": { "parts": [{ "text": SYSTEM_PROMPT }] },
        "contents": [{ "role": "user", "parts": [{ "text": query }] }],
        "generationConfig": { "temperature": 0.4, "maxOutputTokens": 1024 }
    })
}

/// Pull the answer text out of a `generateContent` response.
pub fn extract_text(body: &Value) -> Result<String, String> {
    if let Some(reason) = body.pointer("/promptFeedback/blockReason").and_then(Value::as_str) {
        return Err(format!("The request was blocked by the model ({reason})."));
    }
    let parts = body
        .pointer("/candidates/0/content/parts")
        .and_then(Value::as_array)
        .ok_or_else(|| "The model returned no answer.".to_string())?;
    let text: String = parts.iter().filter_map(|p| p.get("text").and_then(Value::as_str)).collect();
    let text = text.trim();
    if text.is_empty() {
        Err("The model returned an empty answer.".into())
    } else {
        Ok(text.to_string())
    }
}

/// Map an HTTP failure to a message the user can act on.
pub fn http_error_message(status: u16) -> String {
    match status {
        400 | 401 | 403 => "Gemini rejected the API key. Check it in the Key Vault.".into(),
        429 => "Gemini rate limit reached. Wait a minute and try again.".into(),
        500..=599 => "Gemini had a server error. Try again later.".into(),
        other => format!("Unexpected response from Gemini (HTTP {other})."),
    }
}

#[tauri::command]
pub async fn ask_advisor(request: AdvisorRequest) -> Result<String, String> {
    let result = advise(request).await;
    if let Err(message) = &result {
        crate::applog::warn("advisor", message);
    }
    result
}

async fn advise(request: AdvisorRequest) -> Result<String, String> {
    let query = validate_query(&request.query)?;
    let key = request.api_key.trim().to_string();
    crate::keys::validate_key_input(&key)
        .map_err(|_| "Add a valid Gemini API key in the Key Vault to use the Advisor.".to_string())?;

    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|e| format!("Could not start the request: {e}"))?;
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent");
    let resp = client
        .post(url)
        .header("x-goog-api-key", key)
        .json(&build_body(&query))
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "Gemini did not respond in time.".to_string()
            } else {
                "Could not reach Gemini. Check your internet connection.".to_string()
            }
        })?;

    let status = resp.status();
    if !status.is_success() {
        return Err(http_error_message(status.as_u16()));
    }
    let body: Value = resp
        .json()
        .await
        .map_err(|_| "Gemini returned an unreadable response.".to_string())?;
    extract_text(&body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_query() {
        assert!(validate_query("  ").is_err());
        assert!(validate_query(&"x".repeat(2001)).is_err());
        assert_eq!(validate_query("  hello  ").unwrap(), "hello");
    }

    #[test]
    fn body_carries_system_prompt_and_query() {
        let b = build_body("how do I edit files for free?");
        assert_eq!(b["contents"][0]["parts"][0]["text"], "how do I edit files for free?");
        assert!(b["systemInstruction"]["parts"][0]["text"].as_str().unwrap().contains("free"));
    }

    #[test]
    fn extracts_and_joins_text_parts() {
        let body = json!({"candidates":[{"content":{"parts":[{"text":"Use "},{"text":"Aider."}]}}]});
        assert_eq!(extract_text(&body).unwrap(), "Use Aider.");
    }

    #[test]
    fn reports_blocked_and_empty_responses() {
        let blocked = json!({"promptFeedback":{"blockReason":"SAFETY"}});
        assert!(extract_text(&blocked).unwrap_err().contains("SAFETY"));
        assert!(extract_text(&json!({})).is_err());
        assert!(extract_text(&json!({"candidates":[{"content":{"parts":[{"text":"  "}]}}]})).is_err());
    }

    #[test]
    fn http_errors_are_actionable() {
        assert!(http_error_message(403).contains("Key Vault"));
        assert!(http_error_message(429).contains("rate limit"));
        assert!(http_error_message(502).contains("server error"));
    }

    #[test]
    fn missing_key_asks_user_to_add_one_without_network() {
        let err = tauri::async_runtime::block_on(ask_advisor(AdvisorRequest {
            query: "hi".into(),
            api_key: "".into(),
        }))
        .unwrap_err();
        assert!(err.contains("Key Vault"));
    }
}
