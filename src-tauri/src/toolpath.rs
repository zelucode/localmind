//! The PATH that setup commands (`ollama --version`, `npm install -g ...`) run with.
//!
//! Apps opened from Finder or the Dock on macOS (and from some Linux launchers) do not run the
//! user's shell startup files, so they get a bare PATH like `/usr/bin:/bin:/usr/sbin:/sbin`. Tools
//! installed with Homebrew, nvm or npm would then look "not installed" in LocalMind although they
//! work in Terminal. Windows apps inherit the full PATH, so nothing changes there.
//!
//! The fix keeps the app's own PATH first, then adds what the user's login shell reports, then a few
//! well-known folders. The shell is asked once, with a fixed command and a time limit, and the
//! answer is cached for the life of the app. Nothing here comes from the frontend or the feed.

use std::ffi::OsString;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

const START: &str = "__LOCALMIND_PATH_START__";
const END: &str = "__LOCALMIND_PATH_END__";
const SHELL_TIMEOUT: Duration = Duration::from_secs(4);

/// Folders where Homebrew, npm and friends put binaries, in addition to the system ones.
fn well_known_dirs(home: Option<&str>) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin", "/usr/local/sbin"]
        .iter()
        .map(PathBuf::from)
        .collect();
    if let Some(home) = home {
        for sub in [".local/bin", ".npm-global/bin", ".volta/bin", ".bun/bin"] {
            dirs.push(PathBuf::from(home).join(sub));
        }
    }
    dirs
}

/// The text between the markers in a login shell's output. Shell startup files may print their own
/// banners before or after it, which is why the path is wrapped in markers.
fn parse_marked_path(output: &str) -> Option<String> {
    let start = output.find(START)? + START.len();
    let end = output[start..].find(END)? + start;
    let path = output[start..end].trim();
    (!path.is_empty()).then(|| path.to_string())
}

/// Join PATH lists, keeping the first occurrence of each folder, in order.
fn merge_paths(lists: Vec<Vec<PathBuf>>) -> Vec<PathBuf> {
    let mut merged: Vec<PathBuf> = Vec::new();
    for dir in lists.into_iter().flatten() {
        if !dir.as_os_str().is_empty() && !merged.contains(&dir) {
            merged.push(dir);
        }
    }
    merged
}

/// Ask the user's login shell for its PATH (the one Terminal would have). `None` if it cannot be
/// started, fails, or takes longer than `SHELL_TIMEOUT` (for example a startup file waiting for input).
fn login_shell_path() -> Option<String> {
    let shell = std::env::var("SHELL")
        .ok()
        .filter(|s| PathBuf::from(s).is_absolute())
        .unwrap_or_else(|| if cfg!(target_os = "macos") { "/bin/zsh".into() } else { "/bin/bash".into() });

    let mut child = Command::new(shell)
        .args(["-ilc", &format!("printf '%s%s%s' {START} \"$PATH\" {END}")])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    let mut stdout = child.stdout.take()?;
    let reader = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = stdout.read_to_string(&mut s);
        s
    });

    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) if status.success() => break,
            Ok(Some(_)) | Err(_) => return None,
            Ok(None) if started.elapsed() >= SHELL_TIMEOUT => {
                let _ = child.kill();
                let _ = child.wait();
                return None;
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(25)),
        }
    }
    parse_marked_path(&reader.join().ok()?)
}

fn build_tool_path() -> Option<OsString> {
    let started = Instant::now();
    let current: Vec<PathBuf> = std::env::var_os("PATH").map(|p| std::env::split_paths(&p).collect()).unwrap_or_default();
    let shell_path = login_shell_path();
    let from_shell: Vec<PathBuf> = shell_path.as_deref().map(|p| std::env::split_paths(p).collect()).unwrap_or_default();
    let home = std::env::var("HOME").ok();
    let extras: Vec<PathBuf> = well_known_dirs(home.as_deref()).into_iter().filter(|d| d.is_dir()).collect();
    let (app_count, shell_count, extra_count) = (current.len(), from_shell.len(), extras.len());
    let merged = merge_paths(vec![current, from_shell, extras]);
    // Counts only, no folder names: the diagnostics file promises to contain no file paths.
    let summary = format!(
        "tool PATH built in {} ms: app PATH {app_count} folders, login shell {shell_count}, well-known {extra_count}, merged {}",
        started.elapsed().as_millis(),
        merged.len()
    );
    if shell_path.is_some() {
        crate::applog::info("toolpath", &summary);
    } else {
        crate::applog::warn("toolpath", &format!("login shell PATH unavailable (failed, timed out or no markers); {summary}"));
    }
    std::env::join_paths(merged).ok()
}

/// The PATH to give setup commands, or `None` to leave the app's PATH alone (always on Windows).
pub fn tool_path() -> Option<OsString> {
    if cfg!(windows) {
        return None;
    }
    static CACHE: OnceLock<Option<OsString>> = OnceLock::new();
    CACHE.get_or_init(build_tool_path).clone()
}

/// Work out the PATH in the background at startup, so the first Setup page visit does not wait for the shell.
pub fn warm_up() {
    if !cfg!(windows) {
        std::thread::spawn(|| {
            tool_path();
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_path_between_the_markers_and_ignores_shell_noise() {
        let out = format!("Welcome back!\n{START}/opt/homebrew/bin:/usr/bin{END}\nbye");
        assert_eq!(parse_marked_path(&out).as_deref(), Some("/opt/homebrew/bin:/usr/bin"));
    }

    #[test]
    fn no_markers_or_an_empty_path_gives_none() {
        assert_eq!(parse_marked_path("just noise"), None);
        assert_eq!(parse_marked_path(&format!("{START}{END}")), None);
        assert_eq!(parse_marked_path(&format!("{START}/usr/bin")), None);
    }

    #[test]
    fn merging_keeps_order_and_drops_repeats_and_empties() {
        let merged = merge_paths(vec![
            vec![PathBuf::from("/usr/bin"), PathBuf::from("/bin")],
            vec![PathBuf::from("/opt/homebrew/bin"), PathBuf::from("/usr/bin"), PathBuf::new()],
            vec![PathBuf::from("/bin"), PathBuf::from("/usr/local/bin")],
        ]);
        let expected: Vec<PathBuf> = ["/usr/bin", "/bin", "/opt/homebrew/bin", "/usr/local/bin"].iter().map(PathBuf::from).collect();
        assert_eq!(merged, expected);
    }

    #[test]
    fn well_known_dirs_cover_homebrew_on_both_mac_architectures_and_the_users_bin_folders() {
        let dirs = well_known_dirs(Some("/Users/ada"));
        assert!(dirs.contains(&PathBuf::from("/opt/homebrew/bin")), "Apple Silicon Homebrew");
        assert!(dirs.contains(&PathBuf::from("/usr/local/bin")), "Intel Homebrew");
        assert!(dirs.contains(&PathBuf::from("/Users/ada/.npm-global/bin")));
        assert!(well_known_dirs(None).iter().all(|d| d.starts_with("/opt") || d.starts_with("/usr")));
    }

    #[test]
    fn windows_keeps_the_apps_own_path() {
        if cfg!(windows) {
            assert!(tool_path().is_none());
        }
    }

    /// Runs a real login shell, so it only makes sense on macOS and Linux.
    #[cfg(unix)]
    #[test]
    fn a_real_login_shell_reports_a_usable_path() {
        let path = login_shell_path().expect("the login shell should answer");
        assert!(path.split(':').any(|d| d == "/usr/bin"), "PATH was {path}");
        let merged = tool_path().expect("unix always builds a tool path");
        assert!(std::env::split_paths(&merged).any(|d| d == PathBuf::from("/usr/bin")));
    }
}
