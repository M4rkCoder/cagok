use super::{ComparisonMetric, ComparisonType};
use crate::db::repository::DashboardRepository;
use crate::db::{
    CategoryExpense, CategoryMonthlyAmount, DailyExpense, FinancialSummaryStats, MetricStats,     MonthlyFinancialSummaryItem, MonthlyOverview, TransactionWithCategory, YearlySummaryItem,
YearlyDashboardData, DailyCategoryTransaction, TreemapNode,
};
use rusqlite::Connection;
use chrono::{Local, NaiveDate, Duration, Datelike, Months};
use std::collections::HashMap;

pub struct DashboardService;

impl DashboardService {
    pub fn get_monthly_overview(
        conn: &Connection,
        year_month: &str,
    ) -> Result<MonthlyOverview, String> {
        // 1. 레포지토리에서 기초 데이터(소계) 가져오기
        let mut overview = DashboardRepository::get_monthly_overview(conn, year_month)
            .map_err(|e| format!("Failed to get monthly overview: {}", e))?;
    
        // 2. 해당 월의 총 일수(days in month) 계산
        let days_in_month = Self::get_days_in_month(year_month)
            .ok_or_else(|| format!("Invalid year_month format: {}", year_month))?;
    
        // 3. 일평균 지출 계산 (0으로 나누기 방지)
        overview.daily_average = if days_in_month > 0 {
            overview.total_expense / (days_in_month as f64)
        } else {
            0.0
        };
    
        Ok(overview)
    }
    
    /// "YYYY-MM" 형식의 문자열을 받아 해당 월의 일수를 반환하는 헬퍼 함수
    fn get_days_in_month(year_month: &str) -> Option<u32> {
        let parts: Vec<&str> = year_month.split('-').collect();
        if parts.len() != 2 {
            return None;
        }
    
        let year: i32 = parts[0].parse().ok()?;
        let month: u32 = parts[1].parse().ok()?;
    
        // 다음 달의 1일을 구한 뒤 하루를 빼서 현재 달의 마지막 날을 찾음
        let (next_year, next_month) = if month == 12 {
            (year + 1, 1)
        } else {
            (year, month + 1)
        };
    
        let last_day = NaiveDate::from_ymd_opt(next_year, next_month, 1)?
            .pred_opt()? // 하루 전으로 이동
            .day();
    
        Some(last_day)
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

    pub fn get_daily_category_transactions(
        conn: &Connection,
        year_month: &str,
        tx_type: i32,
    ) -> Result<Vec<DailyCategoryTransaction>, String> {
        DashboardRepository::get_daily_category_transactions(conn, year_month, tx_type)
            .map_err(|e| format!("해당 월의 일단위 카테고리 지출 내역을 가져오는데 실패했습니다: {}", e))
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
        base_month: &str, // String -> &str
    ) -> Result<Vec<MonthlyFinancialSummaryItem>, String> {
        // 1. Repository 함수 호출 (이미 &str을 받으므로 그대로 전달)
        let raw_transactions = DashboardRepository::get_transactions_recent_year(conn, base_month).map_err(|e| {
            format!("Failed to get raw monthly financial summary for base month {}: {}", base_month, e)
        })?;
    
        let mut monthly_data: HashMap<String, (f64, f64, f64)> = HashMap::new();
    
        for tx in raw_transactions {
            let entry = monthly_data.entry(tx.year_month).or_insert((0.0, 0.0, 0.0));
            if tx.r#type == 0 {
                entry.0 += tx.amount;
            } else {
                entry.1 += tx.amount;
                if tx.is_fixed == 1 { entry.2 += tx.amount; }
            }
        }
    
        let mut monthly_summary = Vec::new();
        
        // 2. 날짜 파싱 (참조를 사용하여 새 String 생성)
        let end_date = NaiveDate::parse_from_str(&format!("{}-01", base_month), "%Y-%m-%d")
            .map_err(|_| format!("Invalid date format: {}. Expected YYYY-MM", base_month))?;
    
        for i in (0..12).rev() {
            let current_date = end_date.checked_sub_months(Months::new(i as u32))
                .ok_or_else(|| "Date calculation error".to_string())?;
            
            let year_month = current_date.format("%Y-%m").to_string();
            let (total_income, total_expense, fixed_expense) = 
                monthly_data.get(&year_month).cloned().unwrap_or((0.0, 0.0, 0.0));
            
            monthly_summary.push(MonthlyFinancialSummaryItem {
                year_month,
                total_income,
                total_expense,
                net_income: total_income - total_expense,
                fixed_expense,
                variable_expense: total_expense - fixed_expense,
            });
        }
    
        Ok(monthly_summary)
    }

    pub fn get_financial_summary_stats(
        conn: &Connection,
        base_month: &str, // &str로 변경
    ) -> Result<FinancialSummaryStats, String> {
        // 1. Repository 호출 (최근 12개월 범위 조회)
        let raw_transactions = DashboardRepository::get_transactions_recent_year(conn, base_month)
            .map_err(|e| format!("Failed to get raw transactions for base month {}: {}", base_month, e))?;
    
        // Helper to aggregate data by month
        let mut monthly_data: HashMap<String, (f64, f64, f64, i32, i32, i32)> = HashMap::new();
    
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
                if tx.is_fixed == 1 {
                    entry.2 += tx.amount;
                    entry.5 += 1;
                }
            }
        }
    
        let mut income_totals: Vec<f64> = Vec::new();
        let mut expense_totals: Vec<f64> = Vec::new();
        let mut fixed_expense_totals: Vec<f64> = Vec::new();
        let mut net_income_totals: Vec<f64> = Vec::new();
    
        // 2. 날짜 타임라인 생성 (과거 11개월 전 ~ 현재 월까지)
        let end_date = NaiveDate::parse_from_str(&format!("{}-01", base_month), "%Y-%m-%d")
            .map_err(|_| format!("Invalid date format: {}. Expected YYYY-MM", base_month))?;
    
        for i in (0..12).rev() {
            let current_date = end_date.checked_sub_months(Months::new(i as u32))
                .ok_or_else(|| "Date calculation error".to_string())?;
            
            let year_month = current_date.format("%Y-%m").to_string();
            
            let (total_income, total_expense, fixed_expense, _, _, _) = 
                *monthly_data.get(&year_month).unwrap_or(&(0.0, 0.0, 0.0, 0, 0, 0));
            
            income_totals.push(total_income);
            expense_totals.push(total_expense);
            fixed_expense_totals.push(fixed_expense);
            net_income_totals.push(total_income - total_expense);
        }
    
        // 3. 통계 계산 (12개 데이터 포인트를 기반으로 최대/최소/평균 산출)
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
        base_month: &str, // &str로 변경
        category_id: Option<i64>,
    ) -> Result<Vec<CategoryMonthlyAmount>, String> {
        DashboardRepository::get_monthly_category_amounts_recent_year(conn, base_month, category_id)
            .map_err(|e| {
                format!(
                    "Failed to get monthly category amounts for base month {}: {}",
                    base_month, e
                )
            })
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

    pub fn get_top_variable_expenses(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(conn, &year_month, limit, 1, false)
            .map_err(|e| e.to_string())
    }

    pub fn get_top_incomes(conn: &Connection, year_month: String, limit: i32) -> Result<Vec<TransactionWithCategory>, String> {
        DashboardRepository::get_top_transactions(conn, &year_month, limit, 0, false)
            .map_err(|e| e.to_string())
    }
    
    pub fn get_yearly_dashboard_data(
        conn: &Connection,
        base_month: &str, // i32 year 대신 &str base_month 적용
    ) -> Result<YearlyDashboardData, String> {
        // 1. 월별 재무 요약 데이터 생성 (최근 12개월 타임라인)
        let monthly_summary = Self::get_monthly_financial_summary(conn, base_month)?;
    
        // 2. 재무 통계 데이터 가져오기 (최근 12개월 합계/평균/최대/최소 계산)
        // 이 함수 내부도 연도 필터가 아닌 날짜 범위 필터로 수정되어야 합니다.
        let financial_summary_stats = Self::get_financial_summary_stats(conn, base_month)?;
    
        // 3. 최종 데이터 조합하여 반환
        Ok(YearlyDashboardData {
            financial_summary_stats,
            monthly_financial_summary: monthly_summary,
        })
    }

    //지출 트리맵 
    pub fn get_expense_treemap(conn: &Connection, year_month: &str) -> Result<TreemapNode, rusqlite::Error> {
        // 1. DB에서 카테고리별 합계 가져오기 (튜플 형태 데이터)
        let raw_data = DashboardRepository::get_category_sums_by_fixed_status(conn, year_month)?;
    
        let mut fixed_children = Vec::new();
        let mut variable_children = Vec::new();
        let mut total_sum = 0.0;
        let mut fixed_sum = 0.0;
        let mut variable_sum = 0.0;
    
        // 2. 카테고리들을 고정/변동 그룹으로 분류
        // 튜플 분해: (is_fixed, id, name, icon, amount)
        for (is_fixed, id, name, icon, amount) in raw_data {
            total_sum += amount;
            
            let node = TreemapNode {
                name, // 변수명과 필드명이 같으면 생략 가능
                value: amount,
                percentage: 0.0, // 아래에서 계산
                category_id: Some(id),
                category_icon: Some(icon),
                item_type: "category".to_string(),
                children: None,
            };
    
            if is_fixed {
                fixed_sum += amount;
                fixed_children.push(node);
            } else {
                variable_sum += amount;
                variable_children.push(node);
            }
        }
    
        // 3. 비율(percentage) 계산 (총 지출 대비 비율)
        for node in fixed_children.iter_mut() {
            node.percentage = if total_sum > 0.0 { (node.value / total_sum) * 100.0 } else { 0.0 };
        }
        for node in variable_children.iter_mut() {
            node.percentage = if total_sum > 0.0 { (node.value / total_sum) * 100.0 } else { 0.0 };
        }
    
        // 4. 최종 Root 노드 조립
        Ok(TreemapNode {
            name: "total_expense".to_string(),
            value: total_sum,
            percentage: 100.0,
            item_type: "root".to_string(),
            category_id: None,
            category_icon: None,
            children: Some(vec![
                TreemapNode {
                    name: "fixed".to_string(),
                    value: fixed_sum,
                    percentage: if total_sum > 0.0 { (fixed_sum / total_sum) * 100.0 } else { 0.0 },
                    item_type: "group".to_string(),
                    children: Some(fixed_children),
                    category_id: None,
                    category_icon: None,
                },
                TreemapNode {
                    name: "variable".to_string(),
                    value: variable_sum,
                    percentage: if total_sum > 0.0 { (variable_sum / total_sum) * 100.0 } else { 0.0 },
                    item_type: "group".to_string(),
                    children: Some(variable_children),
                    category_id: None,
                    category_icon: None,
                },
            ]),
        })
    }
}
