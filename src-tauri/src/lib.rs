use std::sync::Mutex;
use tauri::Manager;
mod commands;
mod db;
mod services;

use crate::db::RecurringPayload;
use db::init::init_db;
use db::DbConnection;
use services::RecurringService;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle();
            app.manage(app_handle.clone());
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory.");
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory.");
            }
            let db_path = app_dir.join("cagok.db");

            let conn = init_db(&db_path).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            Ok(())
        });
    commands::register_handler(builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
