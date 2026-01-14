use tauri::{Window, Manager, Runtime};
use tauri_plugin_opener::open_path;


#[tauri::command]
pub fn get_db_path<R: Runtime>(window: Window<R>) -> Result<String, String> {
    let app = window.app_handle();
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(app_dir.join("finkro.db").to_string_lossy().to_string())
}

#[tauri::command]
pub fn backup_db<R: Runtime>(window: Window<R>) -> Result<String, String> {
    let app = window.app_handle();
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let db_path = app_dir.join("finkro.db");

    let backup_dir = app_dir.join("backups");
    std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let filename = format!(
        "finkro_backup_{}.db",
        chrono::Local::now().format("%Y%m%d_%H%M%S")
    );

    let backup_path = backup_dir.join(filename);
    std::fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_db_folder<R: Runtime>(window: Window<R>) -> Result<(), String> {
    let app = window.app_handle();
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    open_path(dir, None::<String>).map_err(|e| e.to_string())?;
    Ok(())
}

