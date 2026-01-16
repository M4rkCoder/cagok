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

    // 단일 반복 거래 처리 로직 (재사용을 위해 분리)
    fn process_single_transaction_logic(
        conn: &Connection,
        recurring: RecurringTransaction,
    ) -> Result<i32, String> {
        let today = chrono::Local::now().date_naive();
        let mut created_for_this_recurring = 0;

        // 마지막 생성일이 있으면 그 다음 날부터 시작, 없으면 시작일부터
        let start_checking_date = if let Some(last_created_str) = &recurring.last_created_date {
            NaiveDate::parse_from_str(last_created_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid last created date: {}", e))?
                + Duration::days(1)
        } else {
            NaiveDate::parse_from_str(&recurring.start_date, "%Y-%m-%d")
                .map_err(|e| format!("Invalid start date: {}", e))?
        };

        // 오늘까지 체크 (시작일이 오늘보다 이전이거나 같아야 함)
        let mut current_date = start_checking_date;
        while current_date <= today {
            if Self::should_create_on(&recurring, &current_date)? {
                Self::create_transaction_from_recurring(conn, &recurring, &current_date)?;
                created_for_this_recurring += 1;
            }
            current_date += Duration::days(1);
        }

        // 이 반복 거래에 대해 생성이 하나라도 있었다면 마지막 생성일 업데이트
        if created_for_this_recurring > 0 {
            RecurringTransactionRepository::update_last_created_date(
                conn,
                recurring
                    .id
                    .ok_or("Recurring transaction ID is missing for update".to_string())?,
                &today.format("%Y-%m-%d").to_string(),
            )
            .map_err(|e| format!("Failed to update last created date: {}", e))?;
        }

        Ok(created_for_this_recurring)
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
