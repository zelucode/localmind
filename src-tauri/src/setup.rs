//! One-click setup: detect and install a few curated tools (Ollama, LM Studio, Gemini CLI, Qwen Code), and
//! detect the local runtimes the Runtimes page shows (Jan, OmniRoute).
//!
//! This runs commands on the user's machine, so it is deliberately narrow:
//! - Recipes are compiled into the app. The frontend only ever sends a recipe **id**, never a
//!   command, and a remote data feed cannot add one.
//! - Every recipe command is a fixed program plus fixed arguments, with nothing user-supplied.
//! - The frontend shows `RecipeInfo::command` and asks the user before calling `install_setup_tool`.
//! - No elevation is requested, only one install runs at a time, it can be cancelled, and it has a
//!   time limit.
//!
//! Statuses come from really running `<tool> --version` or finding the tool's own files; nothing is guessed.

use serde::Serialize;
use std::io::{BufRead, BufReader, Read};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tauri::Emitter;

const DETECT_TIMEOUT: Duration = Duration::from_secs(8);
const INSTALL_TIMEOUT: Duration = Duration::from_secs(15 * 60);
const MAX_OUTPUT_LINE_CHARS: usize = 400;
/// Event the install streams its output lines on.
pub const OUTPUT_EVENT: &str = "setup-output";

/// A fixed command: program plus arguments, all known at compile time.
#[derive(Debug, Clone, Copy)]
struct Cmd {
    program: &'static str,
    args: &'static [&'static str],
}

impl Cmd {
    fn display(&self) -> String {
        std::iter::once(self.program).chain(self.args.iter().copied()).collect::<Vec<_>>().join(" ")
    }
}

/// How to install a recipe on one operating system.
#[derive(Debug, Clone, Copy)]
struct Install {
    /// `std::env::consts::OS` value: "windows", "macos" or "linux".
    os: &'static str,
    cmd: Cmd,
    /// Programs that must already exist, with the name shown to the user when one is missing.
    requires: &'static [(&'static str, &'static str)],
}

#[derive(Debug, Clone, Copy)]
struct Recipe {
    id: &'static str,
    name: &'static str,
    description: &'static str,
    /// Any one of these succeeding means the tool is installed.
    detect: &'static [Probe],
    installs: &'static [Install],
    /// Where to get it by hand when there is no one-click install on this system.
    manual_url: &'static str,
}

const NODE_NPM: &[(&str, &str)] = &[("npm", "Node.js (npm)")];

/// One way to find out that a tool is installed.
#[derive(Debug, Clone, Copy)]
enum Probe {
    /// Run a command and expect it to succeed (usually `<tool> --version`).
    Command(Cmd),
    /// A file or folder that only exists when the tool is installed. Starts with `~` (home folder)
    /// and may use `%NAME%` environment variables; `/` works as a separator on every system.
    Path(&'static str),
}

const RECIPES: &[Recipe] = &[
    Recipe {
        id: "ollama",
        name: "Ollama",
        description: "Runs open models on your own computer. Free, no account.",
        detect: &[Probe::Command(Cmd { program: "ollama", args: &["--version"] })],
        installs: &[
            Install {
                os: "windows",
                cmd: Cmd {
                    program: "winget",
                    args: &["install", "--id", "Ollama.Ollama", "-e", "--accept-source-agreements", "--accept-package-agreements"],
                },
                requires: &[("winget", "winget (App Installer)")],
            },
            Install { os: "macos", cmd: Cmd { program: "brew", args: &["install", "ollama"] }, requires: &[("brew", "Homebrew")] },
        ],
        manual_url: "https://ollama.com/download",
    },
    Recipe {
        id: "lm-studio",
        name: "LM Studio",
        description: "Desktop app for downloading and chatting with local models, with a local server. Free.",
        detect: &[
            Probe::Path("~/.lmstudio/bin/lms.exe"),
            Probe::Path("~/.lmstudio/bin/lms"),
            Probe::Path("%LOCALAPPDATA%/Programs/LM Studio/LM Studio.exe"),
            Probe::Path("%LOCALAPPDATA%/LM-Studio/LM Studio.exe"),
            Probe::Path("%ProgramFiles%/LM Studio/LM Studio.exe"),
            Probe::Path("/Applications/LM Studio.app"),
        ],
        installs: &[
            Install {
                os: "windows",
                cmd: Cmd {
                    program: "winget",
                    args: &["install", "--id", "ElementLabs.LMStudio", "-e", "--accept-source-agreements", "--accept-package-agreements"],
                },
                requires: &[("winget", "winget (App Installer)")],
            },
            Install { os: "macos", cmd: Cmd { program: "brew", args: &["install", "--cask", "lm-studio"] }, requires: &[("brew", "Homebrew")] },
        ],
        manual_url: "https://lmstudio.ai",
    },
    Recipe {
        id: "jan",
        name: "Jan",
        description: "Open-source desktop app for running local models with a local API server. Free.",
        detect: &[
            Probe::Path("%LOCALAPPDATA%/Programs/jan/Jan.exe"),
            Probe::Path("%APPDATA%/Jan"),
            Probe::Path("/Applications/Jan.app"),
            Probe::Path("~/jan"),
        ],
        installs: &[],
        manual_url: "https://jan.ai",
    },
    Recipe {
        id: "omniroute",
        name: "OmniRoute",
        description: "Local gateway that pools free-tier providers and local models behind one API port.",
        detect: &[Probe::Command(Cmd { program: "omniroute", args: &["--version"] }), Probe::Path("~/.omniroute")],
        installs: &[],
        manual_url: "https://github.com/danielfrg/omniroute",
    },
    Recipe {
        id: "gemini-cli",
        name: "Gemini CLI",
        description: "Google's terminal coding agent. Generous free tier with a Google login.",
        detect: &[Probe::Command(Cmd { program: "gemini", args: &["--version"] })],
        installs: &[
            Install { os: "windows", cmd: Cmd { program: "npm", args: &["install", "-g", "@google/gemini-cli"] }, requires: NODE_NPM },
            Install { os: "macos", cmd: Cmd { program: "npm", args: &["install", "-g", "@google/gemini-cli"] }, requires: NODE_NPM },
            Install { os: "linux", cmd: Cmd { program: "npm", args: &["install", "-g", "@google/gemini-cli"] }, requires: NODE_NPM },
        ],
        manual_url: "https://github.com/google-gemini/gemini-cli",
    },
    Recipe {
        id: "qwen-code",
        name: "Qwen Code",
        description: "Terminal coding agent for the Qwen models, with a free sign-in tier.",
        detect: &[Probe::Command(Cmd { program: "qwen", args: &["--version"] })],
        installs: &[
            Install { os: "windows", cmd: Cmd { program: "npm", args: &["install", "-g", "@qwen-code/qwen-code"] }, requires: NODE_NPM },
            Install { os: "macos", cmd: Cmd { program: "npm", args: &["install", "-g", "@qwen-code/qwen-code"] }, requires: NODE_NPM },
            Install { os: "linux", cmd: Cmd { program: "npm", args: &["install", "-g", "@qwen-code/qwen-code"] }, requires: NODE_NPM },
        ],
        manual_url: "https://github.com/QwenLM/qwen-code",
    },
];

/// Turn a probe path into a real one: `~` becomes the home folder and `%NAME%` an environment
/// variable. `None` when a variable is not set, so the probe simply does not match.
fn expand_path(template: &str) -> Option<std::path::PathBuf> {
    let mut rest = template;
    let mut out = String::new();
    if let Some(after) = rest.strip_prefix('~') {
        let home = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")).ok()?;
        out.push_str(&home);
        rest = after;
    }
    while let Some(start) = rest.find('%') {
        let (before, after_open) = rest.split_at(start);
        let after_open = &after_open[1..];
        let end = after_open.find('%')?;
        out.push_str(before);
        out.push_str(&std::env::var(&after_open[..end]).ok()?);
        rest = &after_open[end + 1..];
    }
    out.push_str(rest);
    Some(std::path::PathBuf::from(out))
}

fn find_recipe(id: &str) -> Result<&'static Recipe, String> {
    RECIPES.iter().find(|r| r.id == id).ok_or_else(|| format!("Unknown setup recipe \"{id}\"."))
}

fn install_for_this_os(recipe: &Recipe) -> Option<&'static Install> {
    recipe.installs.iter().find(|i| i.os == std::env::consts::OS)
}

// ---------------------------------------------------------------------------------------------
// Running commands
// ---------------------------------------------------------------------------------------------

/// Build a process for a fixed command. On Windows, tools installed by npm are `.cmd` shims that
/// `CreateProcess` cannot start directly, so they go through `cmd /C`; the arguments are fixed
/// strings from the recipe table, never user input. No console window is opened.
fn build_process(cmd: &Cmd) -> Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let mut c = Command::new("cmd");
        c.arg("/C").arg(cmd.program).args(cmd.args);
        c.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        c
    }
    #[cfg(not(windows))]
    {
        let mut c = Command::new(cmd.program);
        c.args(cmd.args);
        c
    }
}

struct Captured {
    success: bool,
    output: String,
}

/// Run a command to completion (killing it after `timeout`) and return its combined output.
/// `None` means it could not be started or did not finish in time.
fn run_capture(cmd: &Cmd, timeout: Duration) -> Option<Captured> {
    let mut child = build_process(cmd).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().ok()?;
    let mut stdout = child.stdout.take()?;
    let mut stderr = child.stderr.take()?;
    let out_reader = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = stdout.read_to_string(&mut s);
        s
    });
    let err_reader = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = stderr.read_to_string(&mut s);
        s
    });

    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) if started.elapsed() >= timeout => {
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(50)),
            Err(_) => break None,
        }
    };
    let status = status?;
    let mut output = out_reader.join().unwrap_or_default();
    output.push('\n');
    output.push_str(&err_reader.join().unwrap_or_default());
    Some(Captured { success: status.success(), output })
}

/// The version number in a `--version` output, e.g. "0.32.5" from "Warning: client version is 0.32.5".
/// Falls back to the first line that contains a digit when no number looks like a version.
fn version_line(output: &str) -> Option<String> {
    let looks_like_version = |token: &str| {
        let t = token.trim_matches(|c: char| !c.is_ascii_alphanumeric()).trim_start_matches(['v', 'V']);
        let mut parts = t.split('.');
        let first = parts.next().unwrap_or("");
        !first.is_empty()
            && first.chars().all(|c| c.is_ascii_digit())
            && t.contains('.')
            && t.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '+')
    };
    for line in output.lines() {
        if let Some(token) = line.split_whitespace().find(|t| looks_like_version(t)) {
            let t = token.trim_matches(|c: char| !c.is_ascii_alphanumeric()).trim_start_matches(['v', 'V']);
            return Some(t.chars().take(40).collect());
        }
    }
    let line = output.lines().map(str::trim).find(|l| !l.is_empty() && l.chars().any(|c| c.is_ascii_digit()))?;
    Some(line.chars().take(80).collect())
}

fn program_exists(program: &'static str) -> bool {
    run_capture(&Cmd { program, args: &["--version"] }, DETECT_TIMEOUT).map(|c| c.success).unwrap_or(false)
}

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    /// The exact command the install would run on this system, or `None` if there is no one-click install here.
    pub command: Option<String>,
    /// What must already be installed (shown to the user), for this system.
    pub requires: Vec<String>,
    pub manual_url: String,
}

fn recipe_info(r: &Recipe) -> RecipeInfo {
    let install = install_for_this_os(r);
    RecipeInfo {
        id: r.id.into(),
        name: r.name.into(),
        description: r.description.into(),
        command: install.map(|i| i.cmd.display()),
        requires: install.map(|i| i.requires.iter().map(|(_, label)| (*label).to_string()).collect()).unwrap_or_default(),
        manual_url: r.manual_url.into(),
    }
}

/// The curated recipes, with the exact command each would run on this system.
#[tauri::command]
pub fn list_setup_recipes() -> Vec<RecipeInfo> {
    RECIPES.iter().map(recipe_info).collect()
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectResult {
    pub id: String,
    /// "installed", "not-installed" or "missing-requirement".
    pub status: String,
    /// Version number from `--version`, when the tool was found by running it.
    pub version: Option<String>,
    /// The file or folder that showed the tool is installed, when it was found that way.
    pub location: Option<String>,
    /// Name of the missing requirement (e.g. "Node.js (npm)"), when status is "missing-requirement".
    pub missing: Option<String>,
}

fn detect_one(r: &Recipe) -> DetectResult {
    let base = DetectResult { id: r.id.into(), status: "not-installed".into(), version: None, location: None, missing: None };
    for probe in r.detect {
        match probe {
            Probe::Command(cmd) => {
                if let Some(found) = run_capture(cmd, DETECT_TIMEOUT).filter(|c| c.success) {
                    return DetectResult { status: "installed".into(), version: version_line(&found.output), ..base };
                }
            }
            Probe::Path(template) => {
                if let Some(path) = expand_path(template).filter(|p| p.exists()) {
                    return DetectResult { status: "installed".into(), location: Some(path.display().to_string().replace('/', std::path::MAIN_SEPARATOR_STR)), ..base };
                }
            }
        }
    }
    if let Some(install) = install_for_this_os(r) {
        if let Some((_, label)) = install.requires.iter().find(|(program, _)| !program_exists(program)) {
            return DetectResult { status: "missing-requirement".into(), missing: Some((*label).to_string()), ..base };
        }
    }
    base
}

/// Check which of the given recipes are installed, by running their `--version` command.
#[tauri::command]
pub async fn detect_setup_tools(ids: Vec<String>) -> Result<Vec<DetectResult>, String> {
    let recipes: Vec<&'static Recipe> = ids.iter().map(|id| find_recipe(id)).collect::<Result<_, _>>()?;
    tauri::async_runtime::spawn_blocking(move || recipes.into_iter().map(detect_one).collect())
        .await
        .map_err(|e| format!("Checking tools failed: {e}"))
}

#[derive(Debug, Clone, Serialize)]
struct OutputLine {
    id: String,
    line: String,
}

static INSTALL_RUNNING: AtomicBool = AtomicBool::new(false);
static CANCEL_REQUESTED: AtomicBool = AtomicBool::new(false);

/// Clears the "an install is running" flag however the install ends.
struct RunningGuard;
impl Drop for RunningGuard {
    fn drop(&mut self) {
        INSTALL_RUNNING.store(false, Ordering::SeqCst);
    }
}

fn clip(line: &str) -> String {
    line.chars().take(MAX_OUTPUT_LINE_CHARS).collect()
}

fn kill_tree(child: &mut std::process::Child) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = Command::new("taskkill")
            .args(["/PID", &child.id().to_string(), "/T", "/F"])
            .creation_flags(0x0800_0000)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
    let _ = child.kill();
}

fn run_install(app: &tauri::AppHandle, recipe: &'static Recipe) -> Result<String, String> {
    let install = install_for_this_os(recipe)
        .ok_or_else(|| format!("{} has no one-click install on this system. Get it from {}", recipe.name, recipe.manual_url))?;
    if let Some((_, label)) = install.requires.iter().find(|(program, _)| !program_exists(program)) {
        return Err(format!("{label} is needed first, and it was not found."));
    }

    CANCEL_REQUESTED.store(false, Ordering::SeqCst);
    let mut child = build_process(&install.cmd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Could not start the install: {e}"))?;

    let id = recipe.id.to_string();
    let mut readers = Vec::new();
    if let Some(out) = child.stdout.take() {
        readers.push(spawn_line_reader(app.clone(), id.clone(), out));
    }
    if let Some(err) = child.stderr.take() {
        readers.push(spawn_line_reader(app.clone(), id.clone(), err));
    }

    let started = Instant::now();
    let outcome = loop {
        if CANCEL_REQUESTED.load(Ordering::SeqCst) {
            kill_tree(&mut child);
            let _ = child.wait();
            break Err("Install cancelled.".to_string());
        }
        match child.try_wait() {
            Ok(Some(status)) if status.success() => break Ok(format!("{} was installed.", recipe.name)),
            Ok(Some(status)) => break Err(format!("The install failed (exit code {}).", status.code().map_or("unknown".into(), |c| c.to_string()))),
            Ok(None) if started.elapsed() >= INSTALL_TIMEOUT => {
                kill_tree(&mut child);
                let _ = child.wait();
                break Err("The install took too long and was stopped.".to_string());
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(150)),
            Err(e) => break Err(format!("Lost track of the install: {e}")),
        }
    };
    for r in readers {
        let _ = r.join();
    }
    outcome
}

fn spawn_line_reader<R: Read + Send + 'static>(app: tauri::AppHandle, id: String, source: R) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        for line in BufReader::new(source).lines().map_while(Result::ok) {
            let line = clip(line.trim_end());
            if !line.trim().is_empty() {
                let _ = app.emit(OUTPUT_EVENT, OutputLine { id: id.clone(), line });
            }
        }
    })
}

/// Run a recipe's install command, streaming its output on the `setup-output` event.
/// Takes a recipe id only; the command comes from the table above.
#[tauri::command]
pub async fn install_setup_tool(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let recipe = find_recipe(&id)?;
    if INSTALL_RUNNING.swap(true, Ordering::SeqCst) {
        return Err("Another install is already running. Wait for it or cancel it first.".into());
    }
    crate::applog::info("setup", &format!("Install started: {}", recipe.id));
    let result = tauri::async_runtime::spawn_blocking(move || {
        let _guard = RunningGuard;
        run_install(&app, recipe)
    })
    .await
    .map_err(|e| format!("The install stopped unexpectedly: {e}"))
    .and_then(|r| r);
    match &result {
        Ok(_) => crate::applog::info("setup", &format!("Install finished: {}", recipe.id)),
        Err(e) => crate::applog::warn("setup", &format!("Install of {} did not finish: {e}", recipe.id)),
    }
    result
}

/// Ask the running install (if any) to stop.
#[tauri::command]
pub fn cancel_setup_install() {
    CANCEL_REQUESTED.store(true, Ordering::SeqCst);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recipe_ids_are_unique_and_lookup_works() {
        let mut ids: Vec<_> = RECIPES.iter().map(|r| r.id).collect();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), RECIPES.len());
        assert!(find_recipe("ollama").is_ok());
        assert!(find_recipe("rm -rf /").is_err());
    }

    #[test]
    fn every_recipe_is_complete_and_has_no_shell_syntax() {
        for r in RECIPES {
            assert!(!r.name.is_empty() && !r.description.is_empty(), "{}", r.id);
            assert!(r.manual_url.starts_with("https://"), "{}", r.id);
            assert!(!r.detect.is_empty(), "{} needs a way to be detected", r.id);
            let mut all: Vec<&Cmd> = r.detect.iter().filter_map(|p| if let Probe::Command(c) = p { Some(c) } else { None }).collect();
            all.extend(r.installs.iter().map(|i| &i.cmd));
            for c in all {
                let text = c.display();
                for bad in ['&', '|', ';', '>', '<', '`', '$', '\n'] {
                    assert!(!text.contains(bad), "{}: {text:?} contains {bad:?}", r.id);
                }
            }
            for i in r.installs {
                assert!(["windows", "macos", "linux"].contains(&i.os), "{}: {}", r.id, i.os);
                assert!(!i.requires.is_empty(), "{} {} needs at least its installer", r.id, i.os);
            }
        }
    }

    #[test]
    fn each_os_appears_once_per_recipe() {
        for r in RECIPES {
            let mut oses: Vec<_> = r.installs.iter().map(|i| i.os).collect();
            oses.sort_unstable();
            oses.dedup();
            assert_eq!(oses.len(), r.installs.len(), "{}", r.id);
        }
    }

    #[test]
    fn info_shows_the_exact_command_for_this_os() {
        let infos = list_setup_recipes();
        assert_eq!(infos.len(), RECIPES.len());
        let gemini = infos.iter().find(|i| i.id == "gemini-cli").unwrap();
        assert_eq!(gemini.command.as_deref(), Some("npm install -g @google/gemini-cli"));
        assert_eq!(gemini.requires, vec!["Node.js (npm)".to_string()]);
    }

    #[test]
    fn version_line_skips_warnings_without_digits() {
        let ollama = "Warning: could not connect to a running Ollama instance\nWarning: client version is 0.32.5\n";
        assert_eq!(version_line(ollama), Some("0.32.5".into()));
        assert_eq!(version_line("\n  \nwarning: no server running\nollama version is 0.5.1\n"), Some("0.5.1".into()));
        assert_eq!(version_line("0.9.2"), Some("0.9.2".into()));
        assert_eq!(version_line("gemini v1.2.3-beta.1\n"), Some("1.2.3-beta.1".into()));
        assert_eq!(version_line("build 7 ready"), Some("build 7 ready".into()));
        assert_eq!(version_line("no numbers here"), None);
        assert_eq!(version_line(&format!("v1 {}", "x".repeat(200))).unwrap().chars().count(), 80);
    }

    #[test]
    fn run_capture_reads_output_and_reports_failure_and_missing_programs() {
        let ok = run_capture(&Cmd { program: "echo", args: &["hello"] }, Duration::from_secs(10)).expect("echo should run");
        assert!(ok.success);
        assert!(ok.output.contains("hello"));

        assert!(!program_exists("localmind-definitely-not-a-real-program"));
    }

    #[test]
    fn detect_reports_not_installed_for_a_missing_tool() {
        let fake = Recipe {
            id: "fake",
            name: "Fake",
            description: "x",
            detect: &[Probe::Command(Cmd { program: "localmind-definitely-not-a-real-program", args: &["--version"] }), Probe::Path("~/localmind-no-such-folder")],
            installs: &[],
            manual_url: "https://example.com",
        };
        let r = detect_one(&fake);
        assert_eq!(r.status, "not-installed");
        assert_eq!(r.version, None);
    }

    #[test]
    fn expand_path_handles_home_variables_and_missing_variables() {
        let home = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")).unwrap();
        assert_eq!(expand_path("~/.lmstudio/bin/lms").unwrap(), std::path::PathBuf::from(format!("{home}/.lmstudio/bin/lms")));
        assert_eq!(expand_path("/Applications/Jan.app").unwrap(), std::path::PathBuf::from("/Applications/Jan.app"));
        std::env::set_var("LOCALMIND_TEST_DIR", "C:/Apps");
        assert_eq!(expand_path("%LOCALMIND_TEST_DIR%/Jan/Jan.exe").unwrap(), std::path::PathBuf::from("C:/Apps/Jan/Jan.exe"));
        assert!(expand_path("%LOCALMIND_UNSET_VARIABLE_XYZ%/x").is_none());
        assert!(expand_path("%unterminated/x").is_none());
    }

    #[test]
    fn a_path_probe_marks_the_tool_installed_and_reports_where() {
        let existing: &'static str = Box::leak(format!("{}/Cargo.toml", env!("CARGO_MANIFEST_DIR")).into_boxed_str());
        let fake = Recipe {
            id: "pathy",
            name: "Pathy",
            description: "x",
            detect: Box::leak(Box::new([Probe::Path("~/localmind-no-such-folder"), Probe::Path(existing)])),
            installs: &[],
            manual_url: "https://example.com",
        };
        let r = detect_one(&fake);
        assert_eq!(r.status, "installed");
        assert_eq!(r.version, None);
        assert!(r.location.unwrap().ends_with("Cargo.toml"));
    }

    #[test]
    fn runtimes_the_ui_shows_have_recipes() {
        for id in ["ollama", "lm-studio", "jan", "omniroute"] {
            assert!(find_recipe(id).is_ok(), "{id}");
        }
    }

    /// Opt-in (`cargo test -- --ignored --nocapture`): prints what detection finds on this machine.
    #[test]
    #[ignore]
    fn print_detection_for_this_machine() {
        for r in RECIPES {
            println!("{:?}", detect_one(r));
        }
    }

    #[test]
    fn clip_limits_line_length() {
        assert_eq!(clip(&"a".repeat(1000)).chars().count(), MAX_OUTPUT_LINE_CHARS);
    }
}
