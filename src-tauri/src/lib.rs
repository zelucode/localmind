mod advisor;
mod feed;
mod keys;
mod probe;
mod secrets;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            probe::probe_ports,
            keys::verify_api_key,
            advisor::ask_advisor,
            feed::fetch_feed,
            secrets::encrypt_secrets,
            secrets::decrypt_secrets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
