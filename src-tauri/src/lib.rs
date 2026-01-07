use std::sync::Mutex;
use tauri::Manager;
mod db;
mod commands;

use db::init::init_db;
use db::DbConnection;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle();
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory.");
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory.");
            }
            let db_path = app_dir.join("finkro.db");

            let conn = init_db(&db_path).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            Ok(())
        });
        commands::register_handler(builder)
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
}
