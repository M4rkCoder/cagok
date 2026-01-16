use crate::db::repository::CategoryRepository;
use crate::db::{Category, DbConnection};
use tauri::State;

#[tauri::command]
pub fn create_category(category: Category, db: State<'_, DbConnection>) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    CategoryRepository::create(&conn, category).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_categories(db: State<'_, DbConnection>) -> Result<Vec<Category>, String> {
    let conn = db.0.lock().unwrap();
    CategoryRepository::get_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_category(
    id: i64,
    category: Category,
    db: State<'_, DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    CategoryRepository::update(&conn, id, category).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_category(id: i64, db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    CategoryRepository::delete(&conn, id).map_err(|e| e.to_string())
}
