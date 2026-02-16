pub mod init;
pub mod repository;

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct DbConnection(pub Mutex<Connection>);

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub r#type: i64, // 'type' is a keyword, so use raw identifier
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: Option<i64>,
    pub description: Option<String>,
    pub amount: f64,
    pub date: String,
    pub r#type: i64,
    pub is_fixed: i64,
    pub remarks: Option<String>,
    pub category_id: Option<i64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionWithCategory {
    pub id: Option<i64>,
    pub description: Option<String>,
    pub amount: f64,
    pub date: String,
    pub r#type: i64,
    pub is_fixed: i64,
    pub remarks: Option<String>,
    pub category_id: Option<i64>,
    pub category_name: Option<String>,
    pub category_icon: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub income_total: f64,
    pub expense_total: f64,
    pub income_count: i64,
    pub expense_count: i64,
    pub total_count: i64,
}

#[derive(Debug, Serialize)]
pub struct MonthlyTotalSummary {
    pub year_month: String,
    pub income_total: f64,
    pub expense_total: f64,
    pub income_count: i64,
    pub expense_count: i64,
    pub total_count: i64,
}

// 대시보드: 월별 오버뷰 관련 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonthlyOverview {
    pub total_income: f64,
    pub total_expense: f64,
    pub net_income: f64,
    pub fixed_expense: f64,
    pub fixed_expense_ratio: f64,
    pub daily_average: f64,
}

// 대시보드: 카테고리별 지출 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CategoryExpense {
    pub category_id: i32,
    pub category_name: String,
    pub category_icon: String,
    pub total_amount: f64,
    pub percentage: f64,
    pub transaction_count: i32,
}

#[derive(serde::Serialize)]
pub struct DailyDetailResponse {
    pub items: Vec<TransactionWithCategory>,
    pub total_amount: f64,
}

#[derive(Debug, serde::Serialize)]
pub struct DailyCategoryTransaction {
    pub date: String,
    pub category_id: i32,
    pub category_name: String,
    pub category_icon: String,
    pub total_amount: f64,
    pub tx_type: i32,
    pub transaction_count: i32,
}

// 대시보드: 일별 지출 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailyExpense {
    pub date: String,
    pub total_amount: f64,
    pub transaction_count: i32,
}

// 대시보드: 연간 요약 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct YearlySummaryItem {
    pub year: i32,
    pub total_income: f64,
    pub total_expense: f64,
    pub net_income: f64,
}

// Repository에서 서비스 레이어로 전달할 월별 트랜잭션의 raw 데이터 구조체
#[derive(Debug, Clone)]
pub struct MonthlyTransactionRaw {
    pub year_month: String,
    pub amount: f64,
    pub r#type: i64, // 0: income, 1: expense
    pub is_fixed: i64, // 0: variable, 1: fixed
}

// 대시보드: 월별 재무 요약 구조체 (Service -> Frontend 전달용)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyFinancialSummaryItem {
    pub year_month: String,
    pub total_income: f64,
    pub total_expense: f64,
    pub net_income: f64,
    pub fixed_expense: f64,
    pub variable_expense: f64,
}

//대시보드: 지출 트리맵 노드
#[derive(Serialize, Default, Debug)]
pub struct TreemapNode {
    pub name: String,
    pub value: f64,
    pub percentage: f64,
    pub category_id: Option<i64>,
    pub category_icon: Option<String>,
    pub item_type: String, // "root", "group", "category"
    pub children: Option<Vec<TreemapNode>>,
}

// 재무 요약 통계값 개별 항목
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetricStats {
    pub total: f64,
    pub average: f64,
    pub max: f64,
    pub min: f64,
    pub max_month: Option<String>,
    pub min_month: Option<String>,
}

impl Default for MetricStats {
    fn default() -> Self {
        MetricStats {
            total: 0.0,
            average: 0.0,
            max: f64::NEG_INFINITY,
            min: f64::INFINITY,
            max_month: None,
            min_month: None,
        }
    }
}

// 연간 재무 요약 통계 전체 구조체
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FinancialSummaryStats {
    pub income: MetricStats,
    pub expense: MetricStats,
    pub net_income: MetricStats,
    pub fixed_expense: MetricStats,
}

impl Default for FinancialSummaryStats {
    fn default() -> Self {
        FinancialSummaryStats {
            income: MetricStats::default(),
            expense: MetricStats::default(),
            net_income: MetricStats::default(),
            fixed_expense: MetricStats::default(),
        }
    }
}

// 대시보드: 월별 카테고리별 금액
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryMonthlyAmount {
    pub year_month: String,
    pub category_id: i64,
    pub category_name: String,
    pub category_icon: String,
    pub total_amount: f64,
    pub transaction_count: i64,
    pub r#type: i64, // 0: income, 1: expense
}

// 반복 지출 관련
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum RecurringFrequency {
    Daily = 0,   // 매일
    Weekly = 1,  // 매주
    Monthly = 2, // 매월
    Yearly = 3,  // 매년
}

impl From<i32> for RecurringFrequency {
    fn from(value: i32) -> Self {
        match value {
            0 => RecurringFrequency::Daily,
            1 => RecurringFrequency::Weekly,
            2 => RecurringFrequency::Monthly,
            3 => RecurringFrequency::Yearly,
            _ => RecurringFrequency::Monthly, // 방어 코드
        }
    }
}

impl From<RecurringFrequency> for i32 {
    fn from(freq: RecurringFrequency) -> Self {
        freq as i32
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RecurringTransaction {
    pub id: Option<i32>,
    pub description: String,
    pub amount: f64,
    pub category_id: Option<i32>,
    pub frequency: RecurringFrequency,
    pub start_date: String, // "2024-01-15"
    pub end_date: Option<String>,
    pub day_of_month: Option<i32>, // 1-31
    pub day_of_week: Option<i32>,  // 0-6 (0=일요일)
    pub is_active: bool,
    pub last_created_date: Option<String>,
    pub remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecurringHistoryItem {
    pub id: i64,
    pub recurring_id: i64,
    pub transaction_id: i64,
    pub created_at: String,
    pub amount: f64,
    pub description: String,
    pub category_name: Option<String>,
    pub category_icon: Option<String>,
    pub category_type: Option<i64>, // 0: Income, 1: Expense
}

#[derive(Clone, Serialize)]
pub struct RecurringPayload {
    pub count: i32,
    pub timestamp: String,
}

// 연간 대시보드 데이터 통합 응답 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct YearlyDashboardData {
    pub financial_summary_stats: FinancialSummaryStats,
    pub monthly_financial_summary: Vec<MonthlyFinancialSummaryItem>,
}

#[derive(serde::Deserialize)]
pub struct TransactionFilters {
    pub keyword: Option<String>,
    pub tx_type: Option<i32>,
    pub is_fixed: Option<bool>,     // <-- 추가
    pub category_ids: Option<Vec<i32>>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub min_amount: Option<f64>,
    pub max_amount: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct CategoryFixedVariableSummary {
    pub category_id: i64,
    pub category_name: String,
    pub category_icon: String,
    pub fixed_total: f64,
    pub variable_total: f64,
    pub fixed_items: Vec<TransactionWithCategory>,
    pub variable_items: Vec<TransactionWithCategory>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonthAmountStat {
    pub month: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CategoryStat {
    pub name: String,
    pub icon: String,
    pub value: f64, // amount or count
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DayOfWeekStat {
    pub day: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BadgeStats {
    pub max_expense_month: Option<MonthAmountStat>,
    pub max_income_month: Option<MonthAmountStat>,
    pub net_income_ratio: f64,
    pub max_expense_category: Option<CategoryStat>,
    pub most_frequent_category: Option<CategoryStat>,
    pub max_expense_day_of_week: Option<DayOfWeekStat>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DayOfWeekCategoryStat {
    pub day_of_week: i32, // 0: Sun, 1: Mon, ...
    pub category_id: i64,
    pub category_name: String,
    pub category_icon: String,
    pub total_amount: f64,
    pub transaction_count: i64,
    pub day_count: i64,
    pub average_amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DayOfWeekTotalStat {
    pub day_of_week: i32,
    pub total_amount: f64,
    pub transaction_count: i64,
    pub day_count: i64, // 해당 요일에 거래가 있었던 일수 (일평균 계산용)
    pub average_amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DayOfWeekResponse {
    pub categories: Vec<DayOfWeekCategoryStat>,
    pub totals: Vec<DayOfWeekTotalStat>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExcelPreviewRow {
    pub id: String,         // uuid
    pub date: String,
    pub tx_type: i32,       // 0: 수입, 1: 지출
    pub category_id: String,
    pub category_name: String, // UI 표시용
    pub is_fixed: i32,      // 0: 변동, 1: 고정
    pub description: String,
    pub amount: String,     // UI 편집을 위해 일단 String으로 전달
    pub remarks: String,
    pub is_valid: bool,
    pub error_msg: Option<String>,
}