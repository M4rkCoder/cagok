use super::{ComparisonMetric, ComparisonType};
use crate::db::repository::DashboardRepository;
use crate::db::{
    CategoryExpense, CategoryMonthlyAmount, DailyExpense, FinancialSummaryStats, MetricStats, MonthlyExpense,
    MonthlyFinancialSummaryItem, MonthlyOverview, TransactionWithCategory, YearlySummaryItem,
YearlyDashboardData,
};
use rusqlite::Connection;
use chrono::{Local, NaiveDate, Duration, Datelike};
use std::collections::HashMap;

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
        let now = Local::now().naive_local().date();
        let current_ym = now.format("%Y-%m").to_string();
    
        let base_date = if year_month == current_ym {
            now
        } else {
            let parts: Vec<&str> = year_month.split('-').collect();
            let year: i32 = parts[0].parse().map_err(|_| "Invalid year format")?;
            let month: u32 = parts[1].parse().map_err(|_| "Invalid month format")?;
    
            if month == 12 {
                NaiveDate::from_ymd_opt(year + 1, 1, 1)
            } else {
                NaiveDate::from_ymd_opt(year, month + 1, 1)
            }
            .ok_or("Invalid date calculation")?
            .pred_opt()
            .ok_or("Invalid date calculation")?
        };
    
        let start_date = (base_date - Duration::days(6)).format("%Y-%m-%d").to_string();
        let end_date = base_date.format("%Y-%m-%d").to_string();
    
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

    pub fn get_yearly_financial_summary(
        conn: &Connection,
        years_to_look_back: i32,
    ) -> Result<Vec<YearlySummaryItem>, String> {
        let current_year = Local::now().year();
        let mut yearly_summary = Vec::new();

        for i in 0..years_to_look_back {
            let year = current_year - i;
            let start_date = format!("{}-01-01", year);
            let end_date = format!("{}-12-31", year);

            let total_income = DashboardRepository::get_amount_sum_by_range(
                conn,
                0, // income
                &start_date,
                &end_date,
            ).map_err(|e| format!("Failed to get total income for year {}: {}", year, e))? as f64;

            let total_expense = DashboardRepository::get_amount_sum_by_range(
                conn,
                1, // expense
                &start_date,
                &end_date,
            ).map_err(|e| format!("Failed to get total expense for year {}: {}", year, e))? as f64;

            yearly_summary.push(YearlySummaryItem {
                year,
                total_income,
                total_expense,
                net_income: total_income - total_expense,
            });
        }

        yearly_summary.reverse();
        Ok(yearly_summary)
    }

    pub fn get_monthly_financial_summary(
        conn: &Connection,
        year: i32,
    ) -> Result<Vec<MonthlyFinancialSummaryItem>, String> {
        let raw_transactions = DashboardRepository::get_transactions_by_year(conn, year).map_err(|e| {
            format!(
                "Failed to get raw monthly financial summary for year {}: {}",
                year, e
            )
        })?;

        let mut monthly_data: HashMap<String, (f64, f64, f64)> = HashMap::new(); // (total_income, total_expense, fixed_expense)

        for tx in raw_transactions {
            let entry = monthly_data
                .entry(tx.year_month)
                .or_insert((0.0, 0.0, 0.0));

            if tx.r#type == 0 { // Income
                entry.0 += tx.amount;
            } else { // Expense
                entry.1 += tx.amount;
                if tx.is_fixed == 1 { // Fixed expense
                    entry.2 += tx.amount;
                }
            }
        }

        let mut monthly_summary = Vec::new();

        for month in 1..=12 {
            let year_month = format!("{}-{:02}", year, month);
            
            let (total_income, total_expense, fixed_expense) = *monthly_data.get(&year_month).unwrap_or(&(0.0, 0.0, 0.0));
            
            let net_income = total_income - total_expense;
            let variable_expense = total_expense - fixed_expense;

            monthly_summary.push(MonthlyFinancialSummaryItem {
                year_month,
                total_income,
                total_expense,
                net_income,
                fixed_expense,
                variable_expense,
            });
        }

        Ok(monthly_summary)
    }

    pub fn get_financial_summary_stats(
        conn: &Connection,
        year: i32,
    ) -> Result<FinancialSummaryStats, String> {
        let raw_transactions = DashboardRepository::get_transactions_by_year(conn, year)
            .map_err(|e| format!("Failed to get raw transactions for year {}: {}", year, e))?;

        // Helper to aggregate data by month
        let mut monthly_data: HashMap<String, (f64, f64, f64, i32, i32, i32)> = HashMap::new(); // (total_income, total_expense, fixed_expense, income_count, expense_count, fixed_expense_count)

        for tx in raw_transactions {
            let entry = monthly_data
                .entry(tx.year_month)
                .or_insert((0.0, 0.0, 0.0, 0, 0, 0));

            if tx.r#type == 0 { // Income
                entry.0 += tx.amount;
                entry.3 += 1;
            } else { // Expense
                entry.1 += tx.amount;
                entry.4 += 1;
                if tx.is_fixed == 1 { // Fixed expense
                    entry.2 += tx.amount;
                    entry.5 += 1;
                }
            }
        }

        let mut income_totals: Vec<f64> = Vec::new();
        let mut expense_totals: Vec<f64> = Vec::new();
        let mut fixed_expense_totals: Vec<f64> = Vec::new();
        let mut net_income_totals: Vec<f64> = Vec::new();

        for month_num in 1..=12 {
            let year_month = format!("{}-{:02}", year, month_num);
            let (total_income, total_expense, fixed_expense, _, _, _) = 
                *monthly_data.get(&year_month).unwrap_or(&(0.0, 0.0, 0.0, 0, 0, 0));
            
            income_totals.push(total_income);
            expense_totals.push(total_expense);
            fixed_expense_totals.push(fixed_expense);
            net_income_totals.push(total_income - total_expense);
        }

        let income_stats = Self::calculate_metric_stats(&income_totals);
        let expense_stats = Self::calculate_metric_stats(&expense_totals);
        let fixed_expense_stats = Self::calculate_metric_stats(&fixed_expense_totals);
        let net_income_stats = Self::calculate_metric_stats(&net_income_totals);

        Ok(FinancialSummaryStats {
            income: income_stats,
            expense: expense_stats,
            net_income: net_income_stats,
            fixed_expense: fixed_expense_stats,
        })
    }

    // Helper function to calculate MetricStats for a given vector of monthly amounts
    fn calculate_metric_stats(amounts: &Vec<f64>) -> MetricStats {
        if amounts.is_empty() {
            return MetricStats::default();
        }

        let total: f64 = amounts.iter().sum();
        let count = amounts.len() as i32;
        let average = if count > 0 { total / count as f64 } else { 0.0 };
        let max = *amounts.iter().max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)).unwrap_or(&0.0);
        let min = *amounts.iter().min_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)).unwrap_or(&0.0);
        
        MetricStats {
            total,
            average,
            max,
            min,
        }
    }

    pub fn get_monthly_category_amounts(
        conn: &Connection,
        year: i32,
        category_id: Option<i64>,
    ) -> Result<Vec<CategoryMonthlyAmount>, String> {
        DashboardRepository::get_monthly_category_amounts_for_year(conn, year, category_id)
            .map_err(|e| format!("Failed to get monthly category amounts for year {}: {}", year, e))
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
            ComparisonType::Expense => {
                let current = DashboardRepository::get_amount_sum_by_range(conn, 1, current_start, current_end).map_err(|e| e.to_string())?;
                let previous = DashboardRepository::get_amount_sum_by_range(conn, 1, previous_start, previous_end).map_err(|e| e.to_string())?;
                Ok(ComparisonMetric::new(current, previous))
            }
            ComparisonType::Income => {
                let current = DashboardRepository::get_amount_sum_by_range(conn, 0, current_start, current_end).map_err(|e| e.to_string())?;
                let previous = DashboardRepository::get_amount_sum_by_range(conn, 0, previous_start, previous_end).map_err(|e| e.to_string())?;
                Ok(ComparisonMetric::new(current, previous))
            }
            ComparisonType::NetIncome => {
                let current_income = DashboardRepository::get_amount_sum_by_range(conn, 0, current_start, current_end).map_err(|e| e.to_string())?;
                let current_expense = DashboardRepository::get_amount_sum_by_range(conn, 1, current_start, current_end).map_err(|e| e.to_string())?;
                let previous_income = DashboardRepository::get_amount_sum_by_range(conn, 0, previous_start, previous_end).map_err(|e| e.to_string())?;
                let previous_expense = DashboardRepository::get_amount_sum_by_range(conn, 1, previous_start, previous_end).map_err(|e| e.to_string())?;
                Ok(ComparisonMetric::new(current_income - current_expense, previous_income - previous_expense))
            }
            ComparisonType::Fixed => {
                let current = DashboardRepository::get_fixed_expense_sum_by_range(conn, current_start, current_end).map_err(|e| e.to_string())?;
                let previous = DashboardRepository::get_fixed_expense_sum_by_range(conn, previous_start, previous_end).map_err(|e| e.to_string())?;
                Ok(ComparisonMetric::new(current, previous))
            }
            ComparisonType::FixedRatio => {
                let current_fixed = DashboardRepository::get_fixed_expense_sum_by_range(conn, current_start, current_end).map_err(|e| e.to_string())?;
                let current_total = DashboardRepository::get_amount_sum_by_range(conn, 1, current_start, current_end).map_err(|e| e.to_string())?;
                let previous_fixed = DashboardRepository::get_fixed_expense_sum_by_range(conn, previous_start, previous_end).map_err(|e| e.to_string())?;
                let previous_total = DashboardRepository::get_amount_sum_by_range(conn, 1, previous_start, previous_end).map_err(|e| e.to_string())?;
                let current_ratio = if current_total == 0 { 0 } else { current_fixed * 100 / current_total };
                let previous_ratio = if previous_total == 0 { 0 } else { previous_fixed * 100 / previous_total };
                Ok(ComparisonMetric::new(current_ratio, previous_ratio))
            }
        }
    }

    pub fn get_top_fixed_expenses(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(conn, &year_month, limit, 1, true)
            .map_err(|e| e.to_string())
    }

    pub fn get_top_incomes(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(conn, &year_month, limit, 0, false)
            .map_err(|e| e.to_string())
    }
    
    pub fn get_yearly_dashboard_data(
        conn: &Connection,
        year: i32,
    ) -> Result<YearlyDashboardData, String> {
        // 1. 월별 재무 요약 데이터 생성 (기존 로직 재사용)
        let monthly_summary = Self::get_monthly_financial_summary(conn, year)?;

        // 2. 재무 통계 데이터 가져오기 (이제 서비스 레이어에서 월별 기반으로 계산)
        let financial_summary_stats = Self::get_financial_summary_stats(conn, year)?;

        // 3. 최종 데이터 조합하여 반환
        Ok(YearlyDashboardData {
            financial_summary_stats,
            monthly_financial_summary: monthly_summary,
        })
}}
