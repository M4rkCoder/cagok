//향후 확대, 현재 미사용

use crate::db::{MonthlyOverview, CategoryExpense, DailyExpense, MonthlyExpense};
use crate::db::repository::DashboardRepository;
use rusqlite::Connection;

pub struct DashboardService;

impl DashboardService {
    pub fn get_monthly_overview(
        conn: &Connection,
        year_month: &str,
    ) -> Result<MonthlyOverview, String> {
        DashboardRepository::get_monthly_overview(conn, year_month)
            .map_err(|e| format!("Failed to get monthly overview: {}", e))
    }
    
    pub fn get_category_expenses(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<CategoryExpense>, String> {
        DashboardRepository::get_category_expenses(conn, year_month)
            .map_err(|e| format!("Failed to get category expenses: {}", e))
    }
    
    pub fn get_daily_expenses(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<DailyExpense>, String> {
        DashboardRepository::get_daily_expenses(conn, year_month)
            .map_err(|e| format!("Failed to get daily expenses: {}", e))
    }
    
    pub fn get_monthly_expenses(
        conn: &Connection,
        months: i32,
    ) -> Result<Vec<MonthlyExpense>, String> {
        DashboardRepository::get_monthly_expenses(conn, months)
            .map_err(|e| format!("Failed to get monthly expenses: {}", e))
    }
}