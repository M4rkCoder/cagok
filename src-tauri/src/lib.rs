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
    let app = commands::register_handler(builder)
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            let state = app_handle.state::<DbConnection>();
            let mut should_backup = false;

            // 1. Check if backup is enabled
            if let Ok(conn) = state.0.lock() {
                should_backup = match crate::db::repository::get_setting(&conn, "auto_backup_enabled") {
                    Ok(Some(val)) => val == "true",
                    _ => false,
                };
            }

            // 2. Perform backup if enabled
            if should_backup {
                match crate::db::backup::perform_auto_backup(app_handle) {
                    Ok(_) => {
                        println!("Auto backup completed successfully.");
                        // 3. Update last backup date
                        if let Ok(conn) = state.0.lock() {
                            let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
                            let _ = crate::db::repository::set_setting(&conn, "last_auto_backup_date", &now);
                            let _ = crate::db::repository::set_setting(&conn, "backup_notification_pending", "true");
                        }
                    }
                    Err(e) => eprintln!("Auto backup failed: {}", e),
                }
            }

            // OneDrive Backup
            let app_handle_clone = app_handle.clone();
            tauri::async_runtime::block_on(async move {
                // Check if OneDrive backup is enabled (defaulting to false for safety unless explicitly enabled)
                let state = app_handle_clone.state::<DbConnection>();
                let should_onedrive_backup = if let Ok(conn) = state.0.lock() {
                    match crate::db::repository::get_setting(&conn, "auto_onedrive_backup") {
                        Ok(Some(val)) => val == "true",
                        _ => false, // Default to false until enabled in settings
                    }
                } else {
                    false
                };

                if should_onedrive_backup {
                     match crate::services::onedrive::backup_db(app_handle_clone.clone()).await {
                        Ok(_) => println!("OneDrive backup completed successfully."),
                        Err(e) => eprintln!("OneDrive backup failed: {}", e),
                     }
                }
            });
        }
    });
}
