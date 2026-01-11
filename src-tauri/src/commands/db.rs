use tauri::{State, AppHandle, Manager};
use tauri_plugin_opener::open_path;

#[tauri::command]
pub fn get_db_path(app: State<'_, AppHandle>) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(app_dir
        .join("finkro.db")
        .to_string_lossy()
        .to_string())
}


#[tauri::command]
pub fn backup_db(app: State<'_, AppHandle>) -> Result<String, String> {
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
pub fn open_db_folder(app: State<AppHandle>) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    open_path(dir, None::<String>).map_err(|e| e.to_string())?;

    Ok(())
}