pub mod init;
pub mod repository;

use serde::{Serialize, Deserialize};
use std::sync::Mutex;
use rusqlite::Connection;

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