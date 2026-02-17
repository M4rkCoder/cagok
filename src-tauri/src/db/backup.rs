use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};

pub fn perform_auto_backup<R: Runtime>(app_handle: &AppHandle<R>) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;

    let db_path = app_dir.join("cagok.db");
    
    // Check if DB exists
    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }

    let backup_dir = app_dir.join("backups");
    std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let filename = "cagok_auto.db";

    let backup_path = backup_dir.join(filename);
    std::fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path)
}

pub fn perform_backup<R: Runtime>(app_handle: &AppHandle<R>) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;

    let db_path = app_dir.join("cagok.db");
    
    // Check if DB exists
    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }

    let backup_dir = app_dir.join("backups");
    std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let filename = format!(
        "cagok_backup_{}.db",
        chrono::Local::now().format("%Y%m%d_%H%M%S")
    );

    let backup_path = backup_dir.join(filename);
    std::fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path)
}
