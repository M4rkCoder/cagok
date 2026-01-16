use crate::db::repository::{get_setting, set_setting};
use crate::db::DbConnection;
use std::process::Command;
use tauri::{Manager, Runtime, State, Window};

#[tauri::command]
pub fn is_app_initialized(conn: State<DbConnection>) -> Result<bool, String> {
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

    set_setting(&conn, "app_initialized", "true").map_err(|e| e.to_string())?;

    set_setting(&conn, "app_name", &app_name).map_err(|e| e.to_string())?;

    set_setting(&conn, "language", &language).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn restart_app<R: Runtime>(window: Window<R>) -> Result<(), String> {
    let app = window.app_handle();

    // 현재 실행 중인 exe 경로 (진짜 exe 파일!)
    let exe_path =
        std::env::current_exe().map_err(|e| format!("failed to get current exe path: {}", e))?;

    // 새 프로세스로 자기 자신 실행
    Command::new(exe_path)
        .spawn()
        .map_err(|e| format!("failed to restart app: {}", e))?;

    // 현재 앱 종료
    app.exit(0);

    Ok(())
}
