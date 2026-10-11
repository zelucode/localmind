//! `app.log`: one log file for both the Rust backend and the React frontend, plus the text that
//! "Report a Problem" saves.
//!
//! Nothing here is sent anywhere. The file lives in the app's log directory, is capped (one
//! rotation, about 30 MB in total), and every line is scrubbed of anything that looks like an API
//! key before it is written, so a log or diagnostics file can be shared without leaking secrets.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

pub const LOG_FILE: &str = "app.log";
/// How many rotated files are kept (`app.log.1` is the newest, `app.log.5` the oldest).
const KEPT_FILES: usize = 5;
/// The file is rotated to `app.log.1` once it passes this size.
const MAX_LOG_BYTES: u64 = 5 * 1024 * 1024;
const MAX_MESSAGE_CHARS: usize = 2000;
/// Lines of log included in a diagnostics file.
const DIAGNOSTIC_LINES: usize = 400;

static LOG_DIR: OnceLock<PathBuf> = OnceLock::new();
static WRITE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    Info,
    Warn,
    Error,
}

impl Level {
    fn label(self) -> &'static str {
        match self {
            Level::Info => "INFO ",
            Level::Warn => "WARN ",
            Level::Error => "ERROR",
        }
    }

    pub fn parse(raw: &str) -> Option<Level> {
        match raw {
            "info" => Some(Level::Info),
            "warn" => Some(Level::Warn),
            "error" => Some(Level::Error),
            _ => None,
        }
    }
}

/// Start logging into `dir` (created if missing). Safe to call once; later calls are ignored.
pub fn init(dir: PathBuf) {
    let _ = fs::create_dir_all(&dir);
    let _ = LOG_DIR.set(dir);
}

pub fn log_dir() -> Option<&'static Path> {
    LOG_DIR.get().map(|p| p.as_path())
}

pub fn info(source: &str, message: &str) {
    write(Level::Info, source, message);
}
pub fn warn(source: &str, message: &str) {
    write(Level::Warn, source, message);
}
pub fn error(source: &str, message: &str) {
    write(Level::Error, source, message);
}

/// Append one line. Logging must never break the app, so every failure is swallowed.
pub fn write(level: Level, source: &str, message: &str) {
    let Some(dir) = log_dir() else { return };
    let line = format_line(now_secs(), level, source, message);
    let _guard = WRITE_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let _ = append(dir, &line, MAX_LOG_BYTES);
}

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

// ---- Formatting ----

/// `2026-10-07T09:30:00Z INFO  [source] message`, on one line, scrubbed and length-limited.
pub fn format_line(secs: u64, level: Level, source: &str, message: &str) -> String {
    let source: String = source.chars().filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | ':' | '.')).take(40).collect();
    let flat: String = message
        .chars()
        .map(|c| if c == '\n' || c == '\r' { ' ' } else { c })
        .take(MAX_MESSAGE_CHARS)
        .collect();
    format!("{} {} [{}] {}", format_utc(secs), level.label(), source, redact(&flat))
}

/// ISO 8601 UTC from Unix seconds (no date library needed).
pub fn format_utc(secs: u64) -> String {
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    // Civil-from-days (Howard Hinnant's algorithm).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, m, d, rem / 3600, (rem % 3600) / 60, rem % 60)
}

// ---- Redaction ----

/// After these markers the rest of the word is a secret, whatever it looks like.
const SECRET_MARKERS: [&str; 7] = ["enc:v1:", "bearer ", "key=", "token=", "x-api-key:", "x-goog-api-key:", "authorization:"];
const SECRET_PREFIXES: [&str; 10] = ["sk-", "gsk_", "AIza", "ghp_", "gho_", "github_pat_", "xox", "hf_", "pk_", "key-"];

/// Replace anything that looks like an API key or token with `[redacted]`.
pub fn redact(input: &str) -> String {
    token_pass(&marker_pass(input))
}

/// Blank the word that follows a marker such as `Bearer ` or `key=` (case-insensitive).
fn marker_pass(input: &str) -> String {
    let lower = input.to_ascii_lowercase();
    let mut out = String::with_capacity(input.len());
    let mut i = 0;
    'scan: while i < input.len() {
        for marker in SECRET_MARKERS {
            if lower[i..].starts_with(marker) {
                out.push_str(&input[i..i + marker.len()]);
                let mut j = i + marker.len();
                // A header value may start with a space ("x-api-key: abc").
                while input[j..].starts_with(' ') {
                    out.push(' ');
                    j += 1;
                }
                // "Authorization: Bearer <token>": keep the scheme word, blank the token after it.
                if lower[j..].starts_with("bearer ") || lower[j..].starts_with("basic ") {
                    let scheme_len = lower[j..].find(' ').unwrap() + 1;
                    out.push_str(&input[j..j + scheme_len]);
                    j += scheme_len;
                }
                let end = input[j..]
                    .find(|c: char| c.is_whitespace() || matches!(c, '"' | '\'' | '&' | ',' | ';'))
                    .map(|n| j + n)
                    .unwrap_or(input.len());
                if end > j {
                    out.push_str("[redacted]");
                }
                i = end;
                continue 'scan;
            }
        }
        let ch = input[i..].chars().next().unwrap();
        out.push(ch);
        i += ch.len_utf8();
    }
    out
}

/// Blank long words that mix letters and digits, and words with a known key prefix.
fn token_pass(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut token = String::new();
    let flush = |token: &mut String, out: &mut String| {
        if looks_secret(token) {
            out.push_str("[redacted]");
        } else {
            out.push_str(token);
        }
        token.clear();
    };
    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '-' {
            token.push(ch);
        } else {
            flush(&mut token, &mut out);
            out.push(ch);
        }
    }
    flush(&mut token, &mut out);
    out
}

fn looks_secret(token: &str) -> bool {
    if token.len() >= 12 && SECRET_PREFIXES.iter().any(|p| token.starts_with(p)) {
        return true;
    }
    token.len() >= 24 && token.chars().any(|c| c.is_ascii_digit()) && token.chars().any(|c| c.is_ascii_alphabetic())
}

// ---- File handling ----

fn rotated_name(n: usize) -> String {
    format!("{LOG_FILE}.{n}")
}

/// Append `line` to `dir/app.log`. When the file is over `max_bytes` it is shifted to `app.log.1`
/// first (older ones move up, the oldest of `KEPT_FILES` is dropped).
pub fn append(dir: &Path, line: &str, max_bytes: u64) -> std::io::Result<()> {
    let path = dir.join(LOG_FILE);
    if fs::metadata(&path).map(|m| m.len() >= max_bytes).unwrap_or(false) {
        let _ = fs::remove_file(dir.join(rotated_name(KEPT_FILES)));
        for n in (1..KEPT_FILES).rev() {
            let _ = fs::rename(dir.join(rotated_name(n)), dir.join(rotated_name(n + 1)));
        }
        fs::rename(&path, dir.join(rotated_name(1)))?;
    }
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    writeln!(file, "{line}")
}

/// The last `max_lines` log lines (oldest rotated file first), oldest to newest.
pub fn tail(dir: &Path, max_lines: usize) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    let names = (1..=KEPT_FILES).rev().map(rotated_name).chain([LOG_FILE.to_string()]);
    for name in names {
        if let Ok(text) = fs::read_to_string(dir.join(name)) {
            lines.extend(text.lines().map(str::to_string));
        }
    }
    let skip = lines.len().saturating_sub(max_lines);
    lines.split_off(skip)
}

/// The text of a diagnostics file. Contains the app version, OS and recent log lines, nothing else:
/// no keys, tools, bookmarks or file paths.
pub fn diagnostics_text(version: &str, secs: u64, dir: Option<&Path>) -> String {
    let mut out = String::new();
    out.push_str("LocalMind diagnostics\n");
    out.push_str(&format!("Generated: {}\n", format_utc(secs)));
    out.push_str(&format!("App version: {version}\n"));
    out.push_str(&format!("OS: {} ({})\n", std::env::consts::OS, std::env::consts::ARCH));
    out.push_str("Included: this header and the recent lines of app.log (keys and tokens are blanked).\n");
    out.push_str("Not included: API keys, tools, bookmarks, settings or file paths.\n\n");
    let lines = dir.map(|d| tail(d, DIAGNOSTIC_LINES)).unwrap_or_default();
    out.push_str(&format!("--- app.log (last {} lines) ---\n", lines.len()));
    if lines.is_empty() {
        out.push_str("(the log is empty or unavailable)\n");
    }
    for line in lines {
        // Lines were scrubbed when written; scrub again in case an older version wrote them.
        out.push_str(&redact(&line));
        out.push('\n');
    }
    out
}

/// Clean a frontend-supplied source tag and mark it as coming from the UI.
pub fn ui_source(raw: &str) -> String {
    let tag: String = raw.chars().filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_')).take(30).collect();
    format!("ui:{}", if tag.is_empty() { "app" } else { &tag })
}

// ---- Commands ----

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogInfo {
    /// Folder that holds app.log (shown to the user so they can open it).
    pub dir: String,
    pub file: String,
}

/// Frontend events go into the same file as backend ones.
#[tauri::command]
pub fn log_event(level: String, source: String, message: String) -> Result<(), String> {
    let level = Level::parse(&level).ok_or_else(|| "Unknown log level.".to_string())?;
    write(level, &ui_source(&source), &message);
    Ok(())
}

#[tauri::command]
pub fn log_info() -> Result<LogInfo, String> {
    let dir = log_dir().ok_or_else(|| "The log folder is not available.".to_string())?;
    Ok(LogInfo { dir: dir.to_string_lossy().into_owned(), file: dir.join(LOG_FILE).to_string_lossy().into_owned() })
}

/// What "Report a Problem" would save, so the user can read it first.
#[tauri::command]
pub fn preview_diagnostics(app: tauri::AppHandle) -> String {
    diagnostics_text(&app.package_info().version.to_string(), now_secs(), log_dir())
}

/// Write the diagnostics file to the Downloads folder (or the log folder if there is none) and return its path.
#[tauri::command]
pub fn save_diagnostics(app: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let secs = now_secs();
    let text = diagnostics_text(&app.package_info().version.to_string(), secs, log_dir());
    let folder = app
        .path()
        .download_dir()
        .ok()
        .filter(|d| d.is_dir())
        .or_else(|| log_dir().map(Path::to_path_buf))
        .ok_or_else(|| "There is no folder to save the file in.".to_string())?;
    let name = format!("localmind-diagnostics-{}.txt", format_utc(secs).replace([':', '-'], "").replace('T', "-").replace('Z', ""));
    let path = folder.join(name);
    fs::write(&path, text).map_err(|e| format!("Could not save the file: {e}"))?;
    info("report", "Diagnostics file saved");
    Ok(path.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("localmind-applog-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn formats_utc_timestamps() {
        assert_eq!(format_utc(0), "1970-01-01T00:00:00Z");
        assert_eq!(format_utc(951_782_400), "2000-02-29T00:00:00Z"); // leap day
        assert_eq!(format_utc(1_791_365_400), "2026-10-07T09:30:00Z");
    }

    #[test]
    fn a_line_is_one_line_with_time_level_and_source() {
        let line = format_line(0, Level::Warn, "probe", "first\nsecond\r\nthird");
        assert_eq!(line, "1970-01-01T00:00:00Z WARN  [probe] first second  third");
    }

    #[test]
    fn long_messages_are_cut_and_sources_are_cleaned() {
        let line = format_line(0, Level::Info, "bad source!\n<x>", &"a ".repeat(5000));
        assert!(line.contains("[badsourcex]"));
        assert!(line.len() < 2100);
    }

    #[test]
    fn redacts_keys_tokens_and_headers() {
        let samples = [
            "key sk-ant-api03-AbCdEf1234567890xyz was rejected",
            "Authorization: Bearer abcDEF123456",
            "GET /v1/models?key=AIzaSyA1234567890abcdefghijklmn&x=1",
            "x-api-key: gsk_1234567890abcdefghij",
            "stored enc:v1:q83+/Zk0n2L7mPq9=AAAA token",
            "token=ghp_abcdefghijklmnopqrstuvwxyz0123456789",
            "plain 0123456789abcdef0123456789abcdef hex",
        ];
        for s in samples {
            let out = redact(s);
            assert!(out.contains("[redacted]"), "{s} -> {out}");
        }
        assert!(!redact("Authorization: Bearer abcDEF123456").contains("abcDEF123456"));
        assert!(!redact("key=AIzaSyA1234567890abcdefghijklmn&x=1").contains("AIza"));
        assert!(redact("key=AIzaSyA1234567890abcdefghijklmn&x=1").contains("&x=1"));
    }

    #[test]
    fn leaves_normal_text_alone() {
        for s in [
            "Verified provider groq: valid",
            "Feed https://raw.githubusercontent.com/o/r/main/feed/providers.json answered HTTP 404",
            "Could not reach the feed server. Check your connection.",
            "probe 3 ports: 11434 online (4 ms)",
            "LocalMind 0.1.0 started on windows (x86_64)",
        ] {
            assert_eq!(redact(s), s);
        }
    }

    #[test]
    fn appends_and_reads_back_in_order() {
        let dir = temp_dir("append");
        for i in 0..5 {
            append(&dir, &format!("line {i}"), MAX_LOG_BYTES).unwrap();
        }
        assert_eq!(tail(&dir, 3), vec!["line 2", "line 3", "line 4"]);
        assert_eq!(tail(&dir, 100).len(), 5);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rotates_when_too_big_and_keeps_only_the_newest_old_files() {
        let dir = temp_dir("rotate");
        for i in 0..100 {
            append(&dir, &format!("entry number {i:02}"), 100).unwrap();
        }
        assert!(dir.join(rotated_name(1)).exists());
        assert!(fs::metadata(dir.join(LOG_FILE)).unwrap().len() < 200);
        let all = tail(&dir, 1000);
        assert_eq!(all.last().unwrap(), "entry number 99");
        assert!(all.len() < 100, "older entries are dropped, not kept forever");
        let files = fs::read_dir(&dir).unwrap().count();
        assert_eq!(files, KEPT_FILES + 1, "app.log plus the newest {KEPT_FILES} rotated files");
        assert!(!dir.join(rotated_name(KEPT_FILES + 1)).exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn diagnostics_have_a_header_the_log_and_no_paths_or_keys() {
        let dir = temp_dir("diag");
        append(&dir, "2026-10-07T09:30:00Z INFO  [probe] ok", MAX_LOG_BYTES).unwrap();
        append(&dir, "old line with sk-ant-api03-AbCdEf1234567890xyz inside", MAX_LOG_BYTES).unwrap();
        let text = diagnostics_text("0.1.0", 1_791_365_400, Some(&dir));
        assert!(text.contains("App version: 0.1.0"));
        assert!(text.contains("Generated: 2026-10-07T09:30:00Z"));
        assert!(text.contains("[probe] ok"));
        assert!(!text.contains("sk-ant"));
        assert!(!text.contains(&*dir.to_string_lossy()));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn diagnostics_work_without_a_log() {
        let text = diagnostics_text("0.1.0", 0, None);
        assert!(text.contains("the log is empty or unavailable"));
    }

    #[test]
    fn frontend_sources_are_tagged_and_cleaned() {
        assert_eq!(ui_source("theme"), "ui:theme");
        assert_eq!(ui_source("a b/c\n"), "ui:abc");
        assert_eq!(ui_source(""), "ui:app");
    }

    #[test]
    fn only_known_levels_are_accepted() {
        assert_eq!(Level::parse("warn"), Some(Level::Warn));
        assert_eq!(Level::parse("debug"), None);
        assert!(log_event("loud".into(), "x".into(), "y".into()).is_err());
    }
}
