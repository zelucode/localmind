mod advisor;
mod applog;
mod backupcrypto;
mod feed;
mod keys;
mod probe;
mod secrets;
mod setup;
mod toolpath;

/// Write panics to app.log before the default handler prints them.
fn install_panic_log() {
    let default_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        applog::error("backend", &format!("Panic: {info}"));
        default_hook(info);
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            if let Ok(dir) = app.path().app_log_dir() {
                applog::init(dir);
            }
            install_panic_log();
            toolpath::warm_up();
            applog::info(
                "backend",
                &format!(
                    "LocalMind {} started on {} ({})",
                    app.package_info().version,
                    std::env::consts::OS,
                    std::env::consts::ARCH
                ),
            );
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            probe::probe_ports,
            keys::verify_api_key,
            advisor::ask_advisor,
            feed::fetch_feed,
            applog::log_event,
            applog::log_info,
            applog::preview_diagnostics,
            applog::save_diagnostics,
            backupcrypto::encrypt_backup,
            backupcrypto::decrypt_backup,
            secrets::encrypt_secrets,
            secrets::decrypt_secrets,
            setup::list_setup_recipes,
            setup::detect_setup_tools,
            setup::install_setup_tool,
            setup::cancel_setup_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
