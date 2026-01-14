use tauri::State;
use crate::db::DbConnection;
use crate::db::repository::{get_setting, set_setting};

#[tauri::command]
pub fn get_setting_command(
    conn: State<DbConnection>,
    key: String,
) -> Result<Option<String>, String> {
    let conn = conn.0.lock().unwrap();
    get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting_command(
    conn: State<DbConnection>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = conn.0.lock().unwrap();
    set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}
