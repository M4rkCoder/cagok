use crate::db::{CategoryExpense, DailyExpense, DbConnection, MonthlyExpense, MonthlyOverview, TransactionWithCategory};
use crate::services::dashboard::DashboardService;
use crate::services::{ComparisonMetric, ComparisonType};
use tauri::State;

#[tauri::command]
pub fn get_monthly_overview(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<MonthlyOverview, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_overview(&conn, &year_month)
}

#[tauri::command]
pub fn get_category_transactions(
    db: State<'_, DbConnection>,
    year_month: String,
    tx_type: i32,
) -> Result<Vec<CategoryExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_category_transactions(&conn, &year_month, tx_type)
}

#[tauri::command]
pub fn get_daily_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<Vec<DailyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_daily_expenses(&conn, &year_month)
}

#[tauri::command]
pub fn get_monthly_transactions(
    db: State<'_, DbConnection>,
    months: i32,
    tx_type: i32,
) -> Result<Vec<MonthlyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_transactions(&conn, months, tx_type)
}

#[tauri::command]
pub fn compare_dashboard(
    db: State<'_, DbConnection>,
    comparison_type: ComparisonType,
    current_start: String,
    current_end: String,
    previous_start: String,
    previous_end: String,
) -> Result<ComparisonMetric, String> {
    let conn = db.0.lock().unwrap();

    DashboardService::compare(
        &conn,
        comparison_type,
        &current_start,
        &current_end,
        &previous_start,
        &previous_end,
    )
}

#[tauri::command]
pub fn get_recent_7days_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<Vec<DailyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_recent_7days_expenses(&conn, &year_month)
}

#[tauri::command]
pub fn get_recent_transactions(
    db: State<'_, DbConnection>,
    year_month: String,
    limit: i32,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_recent_transactions(&conn, &year_month, limit)
}

#[tauri::command]
pub fn get_top_fixed_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
    limit: i32,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_top_fixed_expenses(&conn, year_month, limit)
}

#[tauri::command]
pub fn get_top_incomes(
    db: State<'_, DbConnection>,
    year_month: String,
    limit: i32,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_top_incomes(&conn, year_month, limit)
}