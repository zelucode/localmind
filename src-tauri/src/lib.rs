mod advisor;
mod keys;
mod probe;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            probe::probe_ports,
            keys::verify_api_key,
            advisor::ask_advisor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
