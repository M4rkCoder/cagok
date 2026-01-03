use rusqlite::{Connection, Result, params};
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub r#type: i64, // 'type' is a keyword, so use raw identifier
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Option<i64>,
    pub description: Option<String>,
    pub amount: f64,
    pub date: String,
    pub r#type: i64,
    pub is_fixed: i64,
    pub category_id: Option<i64>,
}

pub fn init_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS categories (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            icon        TEXT NOT NULL,
            type        INTEGER NOT NULL -- 0: Income, 1: Expense
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            description   TEXT,
            amount        REAL NOT NULL,
            date          TEXT NOT NULL,
            type          INTEGER NOT NULL, -- 0: Income, 1: Expense
            is_fixed      INTEGER NOT NULL DEFAULT 0, -- 0: Variable, 1: Fixed
            category_id   INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );
        ",
    )?;

    Ok(conn)
}

// ... Category Commands ...
#[tauri::command]
pub fn create_category(
    name: String,
    icon: String,
    r#type: i64,
    db: tauri::State<'_, super::DbConnection>,
) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO categories (name, icon, type) VALUES (?1, ?2, ?3)",
        (&name, &icon, r#type),
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn get_categories(
    db: tauri::State<'_, super::DbConnection>,
) -> Result<Vec<Category>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, icon, type FROM categories")
        .map_err(|e| e.to_string())?;
    let categories_iter = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            r#type: row.get(3)?,
        })
    })
    .map_err(|e| e.to_string())?;

    let categories: Result<Vec<Category>, rusqlite::Error> = categories_iter.collect();
    categories.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_category(
    id: i64,
    name: String,
    icon: String,
    r#type: i64,
    db: tauri::State<'_, super::DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE categories SET name = ?1, icon = ?2, type = ?3 WHERE id = ?4",
        (&name, &icon, r#type, id),
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_category(id: i64, db: tauri::State<'_, super::DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM categories WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ... Transaction Commands ...

#[tauri::command]
pub fn create_transaction(
    description: Option<String>,
    amount: f64,
    date: String,
    r#type: i64,
    is_fixed: i64,
    category_id: Option<i64>,
    db: tauri::State<'_, super::DbConnection>,
) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO transactions (description, amount, date, type, is_fixed, category_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![description, amount, date, r#type, is_fixed, category_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn get_transactions(
    db: tauri::State<'_, super::DbConnection>,
) -> Result<Vec<Transaction>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, description, amount, date, type, is_fixed, category_id FROM transactions")
        .map_err(|e| e.to_string())?;
    let transactions_iter = stmt.query_map([], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            description: row.get(1)?,
            amount: row.get(2)?,
            date: row.get(3)?,
            r#type: row.get(4)?,
            is_fixed: row.get(5)?,
            category_id: row.get(6)?,
        })
    })
    .map_err(|e| e.to_string())?;

    let transactions: Result<Vec<Transaction>, rusqlite::Error> = transactions_iter.collect();
    transactions.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_transaction(
    id: i64,
    description: Option<String>,
    amount: f64,
    date: String,
    r#type: i64,
    is_fixed: i64,
    category_id: Option<i64>,
    db: tauri::State<'_, super::DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE transactions SET description = ?1, amount = ?2, date = ?3, type = ?4, is_fixed = ?5, category_id = ?6 WHERE id = ?7",
        params![description, amount, date, r#type, is_fixed, category_id, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_transaction(id: i64, db: tauri::State<'_, super::DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
