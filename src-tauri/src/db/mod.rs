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
    #[serde(flatten)]
    pub transaction: Transaction,
    pub category_name: Option<String>,
    pub category_icon: Option<String>,
}

// 대시보드: 월별 오버뷰 관련 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonthlyOverview {
    pub total_income: f64,
    pub total_expense: f64,
    pub net_income: f64,
    pub fixed_expense_ratio: f64,
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

// 대시보드: 일별 지출 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailyExpense {
    pub date: String,
    pub total_amount: f64,
    pub transaction_count: i32,
}

// 대시보드: 월별 지출 추이 구조체
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonthlyExpense {
    pub year_month: String,
    pub total_amount: f64,
    pub transaction_count: i32,
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
