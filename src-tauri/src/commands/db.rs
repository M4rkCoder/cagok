use crate::db::DbConnection;
use csv::ReaderBuilder;
use serde::Deserialize;
use std::fs::File;
use std::io::Write;
use tauri::{Manager, Runtime, State, Window};
use tauri_plugin_opener::open_path;

#[tauri::command]
pub fn get_db_path<R: Runtime>(window: Window<R>) -> Result<String, String> {
    let app = window.app_handle();
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    Ok(app_dir.join("finkro.db").to_string_lossy().to_string())
}

#[tauri::command]
pub fn backup_db<R: Runtime>(window: Window<R>) -> Result<String, String> {
    let app = window.app_handle();
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

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
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

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
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

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
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    open_path(dir, None::<String>).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_backup<R: Runtime>(window: Window<R>, filename: String) -> Result<(), String> {
    let app = window.app_handle();
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let backup_path = app_dir.join("backups").join(&filename);

    if !backup_path.exists() {
        return Err("삭제할 백업 파일을 찾을 수 없습니다.".to_string());
    }

    std::fs::remove_file(&backup_path).map_err(|e| format!("백업 삭제 실패: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn export_transactions_csv<R: Runtime>(
    window: Window<R>,
    conn: State<DbConnection>,
) -> Result<String, String> {
    let app = window.app_handle();

    let document_dir = app.path().document_dir().map_err(|e| e.to_string())?;

    let export_dir = document_dir.join("Finkro").join("Exports");
    std::fs::create_dir_all(&export_dir).map_err(|e| e.to_string())?;

    let filename = format!(
        "finkro_transactions_{}.csv",
        chrono::Local::now().format("%Y%m%d_%H%M%S")
    );
    let csv_path = export_dir.join(&filename);

    let conn = conn.0.lock().map_err(|_| "DB lock failed")?;

    let mut stmt = conn
        .prepare(
            "
            SELECT
              t.date,
              t.type,
              c.name,
              t.amount,
              t.is_fixed,
              t.description,
              t.remarks
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.date ASC
            ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,         // date
                row.get::<_, i64>(1)?,            // type
                row.get::<_, Option<String>>(2)?, // category name
                row.get::<_, f64>(3)?,            // amount
                row.get::<_, i64>(4)?,            // is_fixed
                row.get::<_, Option<String>>(5)?, // description
                row.get::<_, Option<String>>(6)?, // remarks
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut file = File::create(&csv_path).map_err(|e| e.to_string())?;

    file.write_all(b"\xEF\xBB\xBF").map_err(|e| e.to_string())?;

    // CSV Header
    writeln!(
        file,
        "date,type,category,amount,is_fixed,description,remarks"
    )
    .map_err(|e| e.to_string())?;

    for row in rows {
        let (date, ttype, category, amount, is_fixed, description, remarks) =
            row.map_err(|e| e.to_string())?;

        let type_label = match ttype {
            0 => "income",
            1 => "expense",
            _ => "unknown",
        };

        let fixed_label = match is_fixed {
            1 => "fixed",
            _ => "variable",
        };

        let category = category.unwrap_or_else(|| "uncategorized".to_string());
        let description = description.unwrap_or_default().replace('"', "\"\"");
        let remarks = remarks.unwrap_or_default().replace('"', "\"\"");

        writeln!(
            file,
            "\"{}\",\"{}\",\"{}\",{},\"{}\",\"{}\",\"{}\"",
            date, type_label, category, amount, fixed_label, description, remarks
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(csv_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_export_path<R: Runtime>(window: Window<R>) -> Result<String, String> {
    let app = window.app_handle();

    let document_dir = app.path().document_dir().map_err(|e| e.to_string())?;

    let export_dir = document_dir.join("Finkro").join("Exports");

    Ok(export_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_export_folder<R: Runtime>(window: Window<R>) -> Result<(), String> {
    let app = window.app_handle();

    let document_dir = app.path().document_dir().map_err(|e| e.to_string())?;

    let export_dir = document_dir.join("Finkro").join("Exports");

    open_path(export_dir, None::<String>).map_err(|e| e.to_string())?;
    Ok(())
}

fn deserialize_bool_from_int<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s: String = Deserialize::deserialize(deserializer)?;
    match s.as_str() {
        "0" => Ok(false),
        "1" => Ok(true),
        "false" => Ok(false),
        "true" => Ok(true),
        other => Err(serde::de::Error::custom(format!("Invalid bool: {}", other))),
    }
}

#[derive(Debug, Deserialize)]
struct TransactionCsvRow {
    date: String,     // YYYY-MM-DD
    r#type: String,   // "income" | "expense"
    category: String, // DB에 존재하는 카테고리 이름
    amount: Option<f64>,
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    is_fixed: bool,
    description: String,
    remarks: Option<String>,
}

#[tauri::command]
pub fn import_transactions_csv(
    file_path: String,
    conn: State<DbConnection>,
) -> Result<u32, String> {
    let mut conn = conn.0.lock().unwrap();
    let file = File::open(&file_path).map_err(|e| e.to_string())?;

    let mut reader = ReaderBuilder::new().has_headers(true).from_reader(file);

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut inserted = 0;

    for result in reader.deserialize::<TransactionCsvRow>() {
        let row = result.map_err(|e| e.to_string())?;

        // type 변환
        let tx_type = match row.r#type.as_str() {
            "income" => 0,
            "expense" => 1,
            _ => return Err(format!("Invalid type: {}", row.r#type)),
        };

        // category 이름 → id
        let category_id: i64 = tx
            .query_row(
                "SELECT id FROM categories WHERE name = ?",
                [&row.category],
                |r| r.get(0),
            )
            .map_err(|_| format!("카테고리를 찾을 수 없습니다: {}", row.category))?;

        tx.execute(
            r#"
            INSERT INTO transactions
            (description, amount, date, type, category_id, remarks, is_fixed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            (
                row.description,
                row.amount,
                row.date,
                tx_type,
                category_id,
                row.remarks.unwrap_or_default(),
                row.is_fixed,
            ),
        )
        .map_err(|e| e.to_string())?;

        inserted += 1;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(inserted)
}
