use rusqlite::{Connection, params};
use chrono::{NaiveDate, Datelike, Duration};
use crate::db::{RecurringTransaction, RecurringFrequency};
use crate::db::repository::RecurringTransactionRepository;

pub struct RecurringService;

impl RecurringService {
    // 오늘 생성해야 할 거래 확인 및 생성
    pub fn process_recurring_transactions(conn: &Connection) -> Result<i32, String> {
        let recurring_list = RecurringTransactionRepository::get_active(conn)
            .map_err(|e| format!("Failed to get recurring transactions: {}", e))?;
    
        let today = chrono::Local::now().date_naive();
        let mut created_count = 0;
    
        for recurring in recurring_list {
            // 시작 날짜 결정
            let start_date = if let Some(last_created) = &recurring.last_created_date {
                NaiveDate::parse_from_str(last_created, "%Y-%m-%d")
                    .map_err(|e| format!("Invalid last created date: {}", e))?
                    + Duration::days(1)
            } else {
                NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
                    .map_err(|e| format!("Invalid start date: {}", e))?
            };
    
            let mut current_date = start_date;
    
            while current_date <= today {
                if Self::should_create_on(&recurring, &current_date)? {
                    Self::create_transaction_from_recurring(conn, &recurring, &current_date)?;
                    created_count += 1;
                }
                current_date += Duration::days(1);
            }
    
            // 생성이 하나라도 있었다면 마지막 생성일 업데이트
            if created_count > 0 {
                RecurringTransactionRepository::update_last_created_date(
                    conn,
                    recurring.id.unwrap(),
                    &today.format("%Y-%m-%d").to_string(),
                ).map_err(|e| format!("Failed to update last created date: {}", e))?;
            }
        }
    
        Ok(created_count)
    }
    
    fn should_create_on(
        recurring: &RecurringTransaction,
        date: &NaiveDate,
    ) -> Result<bool, String> {
        // 시작일
        let start_date = NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid start date: {}", e))?;
    
        if date < &start_date {
            return Ok(false);
        }
    
        // 종료일
        if let Some(end_date_str) = &recurring.end_date {
            let end_date = NaiveDate::parse_from_str(end_date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid end date: {}", e))?;
            if date > &end_date {
                return Ok(false);
            }
        }
    
        match recurring.frequency {
            RecurringFrequency::Daily => Ok(true),
    
            RecurringFrequency::Weekly => {
                if let Some(day_of_week) = recurring.day_of_week {
                    Ok(date.weekday().num_days_from_sunday() == day_of_week as u32)
                } else {
                    Ok(false)
                }
            }
    
            RecurringFrequency::Monthly => {
                if let Some(day_of_month) = recurring.day_of_month {
                    Ok(date.day() == day_of_month as u32)
                } else {
                    Ok(false)
                }
            }
    
            RecurringFrequency::Yearly => {
                Ok(date.month() == start_date.month() && date.day() == start_date.day())
            }
        }
    }
    
    // 반복 지출로부터 실제 거래 생성
    fn create_transaction_from_recurring(
        conn: &Connection,
        recurring: &RecurringTransaction,
        date: &NaiveDate,
    ) -> Result<(), String> {
        conn.execute(
            "INSERT INTO transactions (description, amount, date, type, is_fixed, category_id, remarks)
            VALUES (?1, ?2, ?3, 1, 1, ?4, ?5)",
            params![
                recurring.description,
                recurring.amount,
                date.format("%Y-%m-%d").to_string(),
                recurring.category_id,
                recurring.remarks,
            ],
        ).map_err(|e| format!("Failed to create transaction: {}", e))?;
        
        Ok(())
    }
}