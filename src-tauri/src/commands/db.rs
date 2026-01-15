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
pub fn list_backups<R: Runtime>(window: Window<R>) -> Result<Vec<String>, String> {
    let app = window.app_handle();
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let backup_dir = app_dir.join("backups");
    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = std::fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                if e.path().is_file() && e.path().extension().map_or(false, |ext| ext == "db") {
                    e.file_name().into_string().ok()
                } else {
                    None
                }
            })
        })
        .collect::<Vec<String>>();

    backups.sort_by(|a, b| b.cmp(a)); // 최신순으로 정렬

    Ok(backups)
}


#[tauri::command]
pub fn restore_backup<R: Runtime>(window: Window<R>, filename: String) -> Result<(), String> {
    let app = window.app_handle();
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let db_path = app_dir.join("finkro.db");
    let backup_path = app_dir.join("backups").join(filename);

    if !backup_path.exists() {
        return Err("백업 파일을 찾을 수 없습니다.".to_string());
    }

    std::fs::copy(&backup_path, &db_path).map_err(|e| e.to_string())?;
    Ok(())
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

