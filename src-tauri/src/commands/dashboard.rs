use crate::db::{
    CategoryExpense, DailyExpense, DbConnection, MonthlyFinancialSummaryItem,
    MonthlyOverview, TransactionWithCategory, YearlySummaryItem, FinancialSummaryStats, CategoryMonthlyAmount, YearlyDashboardData, DailyCategoryTransaction, TreemapNode
};
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
pub fn get_daily_category_transactions(
    db: State<'_, DbConnection>,
    year_month: String, // "YYYY-MM" 형식
    tx_type: i32,       // 0: income, 1: expense
) -> Result<Vec<DailyCategoryTransaction>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_daily_category_transactions(&conn, &year_month, tx_type)
}

#[tauri::command]
pub fn get_yearly_financial_summary_command(
    db: State<'_, DbConnection>,
    years_to_look_back: i32,
) -> Result<Vec<YearlySummaryItem>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_yearly_financial_summary(&conn, years_to_look_back)
}

#[tauri::command]
pub fn get_monthly_financial_summary_command(
    db: State<'_, DbConnection>,
    base_month: String, // i32 year 대신 String base_month를 받습니다.
) -> Result<Vec<MonthlyFinancialSummaryItem>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_financial_summary(&conn, &base_month)
}

#[tauri::command]
pub fn get_financial_summary_stats_command(
    db: State<'_, DbConnection>,
    base_month: String,
) -> Result<FinancialSummaryStats, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_financial_summary_stats(&conn, &base_month)
}

#[tauri::command]
pub fn get_monthly_category_amounts_command(
    db: State<'_, DbConnection>,
    base_month: String, // i32 year에서 String으로 변경
    category_id: Option<i64>,
) -> Result<Vec<CategoryMonthlyAmount>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_monthly_category_amounts(&conn, &base_month, category_id)
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
pub fn get_top_variable_expenses(
    db: State<'_, DbConnection>,
    year_month: String,
    limit: i32,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    DashboardService::get_top_variable_expenses(&conn, year_month, limit)
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

#[tauri::command]
pub fn get_yearly_dashboard_data_command(
    db: State<'_, DbConnection>,
    base_month: String, // i32 year에서 String으로 변경
) -> Result<YearlyDashboardData, String> {
    let conn = db.0.lock().unwrap();

    DashboardService::get_yearly_dashboard_data(&conn, &base_month)
}

#[tauri::command]
pub fn get_expense_treemap(
    db: State<'_, DbConnection>,
    year_month: &str
) -> Result<TreemapNode, String> {
    let conn = db.0.lock().unwrap();
    
    DashboardService::get_expense_treemap(&conn, year_month)
        .map_err(|e| e.to_string())

}