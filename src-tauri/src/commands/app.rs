use crate::db::repository::{get_setting, set_setting};
use crate::db::DbConnection;
use std::process::Command;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use tauri::{Manager, Runtime, State, Window};
use crate::RecurringService;
use crate::RecurringPayload;

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
    currency: String,
    password: Option<String>,
) -> Result<(), String> {
    let conn = conn.0.lock().unwrap();

    set_setting(&conn, "app_initialized", "true").map_err(|e| e.to_string())?;
    set_setting(&conn, "app_name", &app_name).map_err(|e| e.to_string())?;
    set_setting(&conn, "language", &language).map_err(|e| e.to_string())?;
    set_setting(&conn, "currency", &currency).map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        if !pwd.trim().is_empty() {
            let salt = SaltString::generate(&mut OsRng);
            let argon2 = Argon2::default();
            let password_hash = argon2
                .hash_password(pwd.as_bytes(), &salt)
                .map_err(|_| "비밀번호 암호화 중 오류가 발생했습니다.")?
                .to_string();

            set_setting(&conn, "password_hash", &password_hash).map_err(|e| e.to_string())?;
        }
    }

    insert_default_categories(&conn, &language).map_err(|e| e.to_string())?;
    Ok(())
}

// 초기 카테고리 생성을 위한 헬퍼 함수
fn insert_default_categories(conn: &rusqlite::Connection, language: &str) -> rusqlite::Result<()> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM categories",
        [],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Ok(());
    }

    // 언어별 카테고리 정의
    let categories = if language == "ko" {
        vec![
          ("월급", "💼", 0),
          ("부수입", "💰", 0),
          ("용돈", "🎁", 0),
          ("식비", "🍔", 1),
          ("교통비", "🚇", 1),
          ("카페", "☕", 1),
          ("쇼핑", "🛍️", 1),
          ("주거비", "🏠", 1),
          ("의료비", "🏥", 1),
        ]
    } else {
        vec![
          ("Salary", "💼", 0),
          ("ExtraIncome", "💰", 0),
          ("Allowance", "🎁", 0),
          ("Food", "🍔", 1),
          ("Transport", "🚇", 1),
          ("Cafe", "☕", 1),
          ("Shopping", "🛍️", 1),
          ("Housing", "🏠", 1),
          ("Medical", "🏥", 1),
        ]
    };

    for (name, icon, c_type) in categories {
        conn.execute(
            "INSERT INTO categories (name, icon, type) VALUES (?, ?, ?)",
            rusqlite::params![name, icon, c_type],
        )?;
    }
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

#[tauri::command]
pub async fn check_recurring<R: tauri::Runtime>(app_handle: tauri::AppHandle<R>) {
    let db = app_handle.state::<DbConnection>();
    
    let process_result = {
        let conn = db.0.lock().unwrap();
        RecurringService::process_recurring_transactions(&conn)
    };

    if let Ok(count) = process_result {
        if count > 0 {
            use tauri::Emitter;
            app_handle.emit("recurring-summary", RecurringPayload {
                count, // 실제 count 사용
                timestamp: chrono::Local::now().to_rfc3339(),
            }).unwrap();
        }
    }
}
