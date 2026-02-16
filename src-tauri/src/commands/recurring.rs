use crate::db::repository::RecurringTransactionRepository;
use crate::db::{DbConnection, RecurringTransaction, RecurringHistoryItem};
use crate::services::RecurringService;
use tauri::State;

#[tauri::command]
pub fn get_recurring_transactions(
    db: State<'_, DbConnection>,
) -> Result<Vec<RecurringTransaction>, String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::get_all(&conn)
        .map_err(|e| format!("Failed to get recurring transactions: {}", e))
}

#[tauri::command]
pub fn get_recurring_history(
    db: State<'_, DbConnection>,
    limit: i32,
) -> Result<Vec<RecurringHistoryItem>, String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::get_history(&conn, limit)
        .map_err(|e| format!("Failed to get recurring history: {}", e))
}

#[tauri::command]
pub fn create_recurring_transaction(
    db: State<'_, DbConnection>,
    recurring: RecurringTransaction,
) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::create(&conn, &recurring)
        .map_err(|e| format!("Failed to create recurring transaction: {}", e))
}

#[tauri::command]
pub fn update_recurring_transaction(
    db: State<'_, DbConnection>,
    id: i32,
    recurring: RecurringTransaction,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::update(&conn, id, &recurring)
        .map_err(|e| format!("Failed to update recurring transaction: {}", e))
}

#[tauri::command]
pub fn delete_recurring_transaction(db: State<'_, DbConnection>, id: i32) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::delete(&conn, id)
        .map_err(|e| format!("Failed to delete recurring transaction: {}", e))
}

#[tauri::command]
pub fn toggle_recurring_transaction(db: State<'_, DbConnection>, id: i32) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    RecurringTransactionRepository::toggle_active(&conn, id)
        .map_err(|e| format!("Failed to toggle recurring transaction: {}", e))
}

#[tauri::command]
pub fn process_recurring_transactions(db: State<'_, DbConnection>) -> Result<i32, String> {
    let conn = db.0.lock().unwrap();
    RecurringService::process_recurring_transactions(&conn)
}

#[tauri::command]
pub fn process_single_recurring_transaction(
    db: State<'_, DbConnection>,
    recurring_id: i32,
) -> Result<i32, String> {
    let conn = db.0.lock().unwrap();
    RecurringService::process_single_recurring_transaction(&conn, recurring_id)
}
