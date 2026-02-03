use super::{ComparisonMetric, ComparisonType};
use crate::db::repository::DashboardRepository;
use crate::db::{CategoryExpense, DailyExpense, MonthlyExpense, MonthlyOverview, TransactionWithCategory };
use rusqlite::Connection;
use chrono::{Local, NaiveDate, Duration};

pub struct DashboardService;

impl DashboardService {
    pub fn get_monthly_overview(
        conn: &Connection,
        year_month: &str,
    ) -> Result<MonthlyOverview, String> {
        DashboardRepository::get_monthly_overview(conn, year_month)
            .map_err(|e| format!("Failed to get monthly overview: {}", e))
    }

    pub fn get_category_transactions(
        conn: &Connection,
        year_month: &str,
        tx_type: i32,
    ) -> Result<Vec<CategoryExpense>, String> {
        DashboardRepository::get_category_transactions(conn, year_month, tx_type)
            .map_err(|e| format!("Failed to get category expenses: {}", e))
    }

    pub fn get_daily_expenses(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<DailyExpense>, String> {
        DashboardRepository::get_daily_expenses(conn, year_month)
            .map_err(|e| format!("Failed to get daily expenses: {}", e))
    }

    pub fn get_recent_7days_expenses(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<DailyExpense>, String> {
        // 1. 현재 날짜와 비교를 위한 현재 월 가져오기
        let now = Local::now().naive_local().date();
        let current_ym = now.format("%Y-%m").to_string();
    
        // 2. 기준일(base_date) 결정
        let base_date = if year_month == current_ym {
            // 이번 달이면 '오늘' 기준
            now
        } else {
            // 과거/미래 월이면 그 달의 '마지막 날' 기준
            let parts: Vec<&str> = year_month.split('-').collect();
            let year: i32 = parts[0].parse().map_err(|_| "Invalid year format")?;
            let month: u32 = parts[1].parse().map_err(|_| "Invalid month format")?;
    
            // 해당 월의 마지막 날 계산 (다음 달 1일의 전날)
            if month == 12 {
                NaiveDate::from_ymd_opt(year + 1, 1, 1)
            } else {
                NaiveDate::from_ymd_opt(year, month + 1, 1)
            }
            .ok_or("Invalid date calculation")?
            .pred_opt()
            .ok_or("Invalid date calculation")?
        };
    
        // 3. 7일 범위 계산
        let start_date = (base_date - Duration::days(6)).format("%Y-%m-%d").to_string();
        let end_date = base_date.format("%Y-%m-%d").to_string();
    
        // 4. 레포지토리 호출 (범위 기반 조회용으로 새로 만든 메서드 호출)
        DashboardRepository::get_daily_expenses_by_range(conn, &start_date, &end_date)
            .map_err(|e| format!("Failed to get daily expenses: {}", e))
    }

    pub fn get_recent_transactions(
        conn: &Connection,
        year_month: &str,
        limit: i32,
    ) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_recent_transactions(conn, year_month, limit)
            .map_err(|e| format!("최근 지출 내역을 가져오는데 실패했습니다: {}", e))
    }

    pub fn get_monthly_transactions(
        conn: &Connection,
        months: i32,
        tx_type: i32,
    ) -> Result<Vec<MonthlyExpense>, String> {
        DashboardRepository::get_monthly_transactions(conn, months, tx_type)
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
                    conn,
                    1,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let previous = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    1,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(current, previous))
            }

            // 🔹 총 수입 비교
            ComparisonType::Income => {
                let current = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    0,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let previous = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    0,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(current, previous))
            }

            // 🔹 순수입 비교 (수입 - 지출)
            ComparisonType::NetIncome => {
                let current_income = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    0,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let current_expense = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    1,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let previous_income = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    0,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                let previous_expense = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    1,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                Ok(ComparisonMetric::new(
                    current_income - current_expense,
                    previous_income - previous_expense,
                ))
            }

            ComparisonType::Fixed => {
                let current = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;
            
                let previous = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;
            
                Ok(ComparisonMetric::new(current, previous))
            }
            // 🔹 고정비율 비교
            ComparisonType::FixedRatio => {
                let current_fixed = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let current_total = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    1,
                    current_start,
                    current_end,
                )
                .map_err(|e| e.to_string())?;

                let previous_fixed = DashboardRepository::get_fixed_expense_sum_by_range(
                    conn,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                let previous_total = DashboardRepository::get_amount_sum_by_range(
                    conn,
                    1,
                    previous_start,
                    previous_end,
                )
                .map_err(|e| e.to_string())?;

                let current_ratio = if current_total == 0 {
                    0
                } else {
                    current_fixed * 100 / current_total
                };
                let previous_ratio = if previous_total == 0 {
                    0
                } else {
                    previous_fixed * 100 / previous_total
                };

                Ok(ComparisonMetric::new(current_ratio, previous_ratio))
            }
        }
    }
    pub fn get_top_fixed_expenses(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(&conn, &year_month, limit, 1, true)
            .map_err(|e| e.to_string())
    }

    pub fn get_top_incomes(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(&conn, &year_month, limit, 0, false)
            .map_err(|e| e.to_string())
    }

}
