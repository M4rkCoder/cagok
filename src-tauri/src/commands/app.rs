use tauri::State;
use crate::db::DbConnection;
use crate::db::repository::{get_setting, set_setting};

#[tauri::command]
pub fn is_app_initialized(
    conn: State<DbConnection>,
) -> Result<bool, String> {
    let conn = conn.0.lock().unwrap();

    get_setting(&conn, "app_initialized")
        .map(|v| v.is_some())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn initialize_app(
    conn: State<DbConnection>,
    app_name: String,
    language: String,
) -> Result<(), String> {
    let conn = conn.0.lock().unwrap();

    set_setting(&conn, "app_initialized", "true")
        .map_err(|e| e.to_string())?;

    set_setting(&conn, "app_name", &app_name)
        .map_err(|e| e.to_string())?;

    set_setting(&conn, "language", &language)
        .map_err(|e| e.to_string())?;

    Ok(())
}