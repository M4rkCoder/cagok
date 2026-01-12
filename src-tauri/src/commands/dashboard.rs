use tauri::State;
use crate::db::{MonthlyOverview, CategoryExpense, DailyExpense, MonthlyExpense, DbConnection};
use crate::services::dashboard::DashboardService;
use crate::services::{ComparisonMetric, ComparisonType};

#[tauri::command]
pub fn get_monthly_overview(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<MonthlyOverview, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_overview(&conn, &year_month)
}

#[tauri::command]
pub fn get_category_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
) -> Result<Vec<CategoryExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_category_expenses(&conn, &year_month)
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
pub fn get_monthly_expenses(
    db: State<'_, DbConnection>,
    months: i32,
) -> Result<Vec<MonthlyExpense>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_expenses(&conn, months)
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