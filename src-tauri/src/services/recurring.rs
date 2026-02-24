use crate::db::repository::RecurringTransactionRepository;
use crate::db::{RecurringFrequency, RecurringTransaction};
use chrono::{Datelike, Duration, NaiveDate};
use rusqlite::{params, Connection};

pub struct RecurringService;

impl RecurringService {
    // 오늘 생성해야 할 거래 확인 및 생성 (전체)
    pub fn process_recurring_transactions(conn: &Connection) -> Result<i32, String> {
        let recurring_list = RecurringTransactionRepository::get_active(conn)
            .map_err(|e| format!("Failed to get recurring transactions: {}", e))?;

        let mut created_count = 0;

        for recurring in recurring_list {
            created_count += Self::process_single_transaction_logic(conn, recurring)?;
        }

        Ok(created_count)
    }

    fn process_single_transaction_logic(
        conn: &Connection,
        recurring: RecurringTransaction,
    ) -> Result<i32, String> {
        let today = chrono::Local::now().date_naive();
        let mut created_for_this_recurring = 0;

        // [수정] last_created_date 무시하고 항상 시작일부터 체크하거나, 
        // 혹은 효율을 위해 시작일과 (마지막 생성일 - 델타) 중 더 과거를 선택
        let start_checking_date = NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid start date: {}", e))?;

        let mut current_date = start_checking_date;
        
        while current_date <= today {
            // 1. 해당 주기 조건에 맞는지 확인
            if Self::should_create_on(&recurring, &current_date)? {
                // 2. [추가] 중복 생성 방지: 이 날짜에 이미 생성된 이력이 있는지 확인
                if !Self::already_exists(conn, recurring.id.unwrap(), &current_date)? {
                    Self::create_transaction_from_recurring(conn, &recurring, &current_date)?;
                    created_for_this_recurring += 1;
                }
            }
            current_date += Duration::days(1);
        }

        // 마지막 생성일 업데이트 (기존 로직 유지)
        if created_for_this_recurring > 0 {
            RecurringTransactionRepository::update_last_created_date(
                conn,
                recurring.id.ok_or("ID missing")?,
                &today.format("%Y-%m-%d").to_string(),
            ).map_err(|e| e.to_string())?;
        }

        Ok(created_for_this_recurring)
    }

    fn already_exists(conn: &Connection, recurring_id: i32, date: &NaiveDate) -> Result<bool, String> {
        let date_str = date.format("%Y-%m-%d").to_string();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM recurring_history WHERE recurring_id = ?1 AND created_at = ?2",
            params![recurring_id, date_str],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;

        Ok(count > 0)
    }

    // 단일 반복 거래 처리 (Tauri Command에서 호출될 예정)
    pub fn process_single_recurring_transaction(
        conn: &Connection,
        recurring_id: i32,
    ) -> Result<i32, String> {
        let recurring = RecurringTransactionRepository::get_by_id(conn, recurring_id)?.ok_or(
            format!("Recurring transaction with ID {} not found", recurring_id),
        )?;

        if !recurring.is_active {
            return Ok(0); // 비활성 거래는 처리하지 않음
        }

        Self::process_single_transaction_logic(conn, recurring)
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
                let start_date_month = NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
                    .map_err(|e| format!("Invalid start date for yearly check: {}", e))?
                    .month();
                let start_date_day = NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
                    .map_err(|e| format!("Invalid start date for yearly check: {}", e))?
                    .day();

                Ok(date.month() == start_date_month && date.day() == start_date_day)
            }
        }
    }

    // 반복 지출로부터 실제 거래 생성
    fn create_transaction_from_recurring(
        conn: &Connection,
        recurring: &RecurringTransaction,
        date: &NaiveDate,
    ) -> Result<(), String> {
        // 1. Get category type
        let category_type: i64 = if let Some(cat_id) = recurring.category_id {
             conn.query_row(
                "SELECT type FROM categories WHERE id = ?1",
                params![cat_id],
                |row| row.get(0),
            ).unwrap_or(1) // Default to Expense if not found
        } else {
            1 // Default to Expense if no category
        };

        // 2. Insert transaction
        conn.execute(
            "INSERT INTO transactions (description, amount, date, type, is_fixed, category_id, remarks)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                recurring.description,
                recurring.amount,
                date.format("%Y-%m-%d").to_string(),
                category_type,
                recurring.is_fixed,
                recurring.category_id,
                recurring.remarks,
            ],
        ).map_err(|e| format!("Failed to create transaction: {}", e))?;

        let transaction_id = conn.last_insert_rowid();

        // 3. Insert history
        if let Some(recurring_id) = recurring.id {
             conn.execute(
                "INSERT INTO recurring_history (recurring_id, transaction_id, created_at)
                VALUES (?1, ?2, ?3)",
                params![
                    recurring_id,
                    transaction_id,
                    date.format("%Y-%m-%d").to_string(),
                ],
            ).map_err(|e| format!("Failed to create history: {}", e))?;
        }

        Ok(())
    }
}
