use std::sync::Mutex;
use tauri::Manager;
mod db;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub struct DbConnection(pub Mutex<rusqlite::Connection>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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

            let conn = db::init_db(&db_path).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Category handlers
            db::create_category,
            db::get_categories,
            db::update_category,
            db::delete_category,
            // Transaction handlers
            db::create_transaction,
            db::get_transactions,
            db::get_transactions_with_category,
            db::update_transaction,
            db::delete_transaction
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
