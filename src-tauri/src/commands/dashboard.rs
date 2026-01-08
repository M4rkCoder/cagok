use tauri::State;
use crate::db::repository::DashboardRepository;
use crate::db::{MonthlyOverview, CategoryExpense, DailyExpense, MonthlyExpense, DbConnection};

#[tauri::command]
pub fn get_monthly_overview(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<MonthlyOverview, String> {
    let conn = db.0.lock().unwrap();
    DashboardRepository::get_monthly_overview(&conn, &year_month)
        .map_err(|e| format!("Failed to get monthly overview: {}", e))
}

#[tauri::command]
pub fn get_category_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<Vec<CategoryExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardRepository::get_category_expenses(&conn, &year_month)
        .map_err(|e| format!("Failed to get category expenses: {}", e))
}

#[tauri::command]
pub fn get_daily_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<Vec<DailyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardRepository::get_daily_expenses(&conn, &year_month)
        .map_err(|e| format!("Failed to get daily expenses: {}", e))
}

#[tauri::command]
pub fn get_monthly_expenses(
    db: State<'_, DbConnection>,
    months: i32,
) -> Result<Vec<MonthlyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardRepository::get_monthly_expenses(&conn, months)
        .map_err(|e| format!("Failed to get monthly expenses: {}", e))
}