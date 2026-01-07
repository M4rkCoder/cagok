use tauri::State;
use crate::db::{Transaction, TransactionWithCategory, DbConnection};
use crate::db::repository::TransactionRepository;

#[tauri::command]
pub fn create_transaction(
    transaction: Transaction, 
    db: State<'_, DbConnection>
) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::create(&conn, transaction)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions(
    db: State<'_, DbConnection>
) -> Result<Vec<Transaction>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_all(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions_with_category(
    db: State<'_, DbConnection>
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_all_with_category(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_transaction(
    id: i64, 
    transaction: Transaction, 
    db: State<'_, DbConnection>
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::update(&conn, id, transaction)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_transaction(
    id: i64, 
    db: State<'_, DbConnection>
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::delete(&conn, id)
        .map_err(|e| e.to_string())
}