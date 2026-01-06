use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
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
    pub id: i64,
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