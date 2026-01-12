use crate::db::{MonthlyOverview, CategoryExpense, DailyExpense, MonthlyExpense};
use crate::db::repository::DashboardRepository;
use super::{ComparisonMetric, ComparisonType};
use rusqlite::Connection;

//비교생성기 유틸 함수
fn make_comparison(current: i64, previous: i64) -> ComparisonMetric {
    let diff = current - previous;
    let diff_rate = if previous == 0 {
        0.0
    } else {
        (diff as f64 / previous as f64) * 100.0
    };

    ComparisonMetric {
        current,
        previous,
        diff,
        diff_rate,
    }
}

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
    pub fn compare(
        conn: &Connection,
        comparison_type: ComparisonType,
        current_start: &str,
        current_end: &str,
        previous_start: &str,
        previous_end: &str,
    ) -> Result<ComparisonMetric, String> {
        match comparison_type {
            // 🔹 총 지출 비교
            ComparisonType::Expense => {
                let current = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let previous = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(current, previous))
            }

            // 🔹 총 수입 비교
            ComparisonType::Income => {
                let current = DashboardRepository::get_amount_sum_by_range(
                    conn, 0, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let previous = DashboardRepository::get_amount_sum_by_range(
                    conn, 0, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(current, previous))
            }

            // 🔹 순수입 비교 (수입 - 지출)
            ComparisonType::NetIncome => {
                let current_income = DashboardRepository::get_amount_sum_by_range(
                    conn, 0, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let current_expense = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let previous_income = DashboardRepository::get_amount_sum_by_range(
                    conn, 0, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                let previous_expense = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(
                    current_income - current_expense,
                    previous_income - previous_expense,
                ))
            }

            // 🔹 고정비율 비교
            ComparisonType::FixedRatio => {
                let current_fixed = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let current_total = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, current_start, current_end,
                ).map_err(|e| e.to_string())?;

                let previous_fixed = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                let previous_total = DashboardRepository::get_amount_sum_by_range(
                    conn, 1, previous_start, previous_end,
                ).map_err(|e| e.to_string())?;

                let current_ratio =
                    if current_total == 0 { 0 } else { current_fixed * 100 / current_total };
                let previous_ratio =
                    if previous_total == 0 { 0 } else { previous_fixed * 100 / previous_total };

                Ok(ComparisonMetric::new(current_ratio, previous_ratio))
            }
        }
    }
}