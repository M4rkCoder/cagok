use super::{Category, CategoryExpense, CategoryMonthlyAmount, DailyExpense, MonthlyExpense, MonthlyOverview, RecurringFrequency, RecurringTransaction, Transaction, TransactionWithCategory, MonthlyTransactionRaw};
use rusqlite::{params, Connection, Result};

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;

    let result = stmt.query_row(params![key], |row| row.get(0));

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "
        INSERT INTO app_settings (key, value)
        VALUES (?1, ?2)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        ",
        params![key, value],
    )?;
    Ok(())
}

pub struct TransactionRepository;

impl TransactionRepository {
    pub fn create(conn: &Connection, t: Transaction) -> Result<i64> {
        conn.execute(
            "INSERT INTO transactions (description, amount, date, type, is_fixed, remarks, category_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![t.description, t.amount, t.date, t.r#type, t.is_fixed, t.remarks, t.category_id],
    )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_all(conn: &Connection) -> Result<Vec<Transaction>> {
        let mut stmt = conn.prepare("SELECT id, description, amount, date, type, is_fixed, remarks, category_id FROM transactions ORDERY BY date DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_all_with_category(conn: &Connection) -> Result<Vec<TransactionWithCategory>> {
        let mut stmt = conn.prepare(
            "SELECT t.id, t.description, t.amount, t.date, t.type, t.is_fixed, t.remarks, t.category_id, 
                    c.name, c.icon 
             FROM transactions t 
             LEFT JOIN categories c ON t.category_id = c.id 
             ORDER BY t.date DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
                category_name: row.get(8)?,
                category_icon: row.get(9)?,
            })
        })?;

        rows.collect()
    }

    pub fn update(conn: &Connection, id: i64, t: Transaction) -> Result<()> {
        conn.execute(
            "UPDATE transactions 
             SET description = ?1, amount = ?2, date = ?3, type = ?4, is_fixed = ?5, remarks = ?6, category_id = ?7 
             WHERE id = ?8",
            params![t.description, t.amount, t.date, t.r#type, t.is_fixed, t.remarks, t.category_id, id],)?;
        Ok(())
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM transactions WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_by_date_with_category(
        conn: &Connection,
        date: &str,
    ) -> Result<Vec<TransactionWithCategory>> {
        let query = "
            SELECT 
                t.id, t.description, t.amount, t.date, t.type,
                t.is_fixed, t.remarks, t.category_id,
                c.name, c.icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.date = ?1
            ORDER BY t.id DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![date], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,

                category_name: row.get(8)?,
                category_icon: row.get(9)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_by_month_and_category(
        conn: &Connection,
        year_month: &str,
        category_id: i64,
    ) -> Result<Vec<TransactionWithCategory>, rusqlite::Error> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        let query = "
            SELECT 
                t.id,
                t.description,
                t.amount,
                t.date,
                t.type,
                t.is_fixed,
                t.remarks,
                t.category_id,
                c.name,
                c.icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.category_id = ?1
              AND t.date BETWEEN ?2 AND ?3
            ORDER BY t.date DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![category_id, start_date, end_date], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
                category_name: row.get(8)?,
                category_icon: row.get(9)?,
            })
        })?;

        rows.collect()
    }
}

pub struct CategoryRepository;

impl CategoryRepository {
    pub fn create(conn: &Connection, c: Category) -> Result<i64> {
        conn.execute(
            "INSERT INTO categories (name, icon, type) VALUES (?1, ?2, ?3)",
            params![c.name, c.icon, c.r#type],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_all(conn: &Connection) -> Result<Vec<Category>, rusqlite::Error> {
        let mut stmt = conn.prepare("SELECT id, name, icon, type FROM categories")?;
        let rows = stmt.query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                r#type: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    pub fn update(conn: &Connection, id: i64, c: Category) -> Result<()> {
        conn.execute(
            "UPDATE categories SET name = ?1, icon = ?2, type = ?3 WHERE id = ?4",
            params![c.name, c.icon, c.r#type, id],
        )?;
        Ok(())
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM categories WHERE id = ?1", [id])?;
        Ok(())
    }
}

pub struct DashboardRepository;

impl DashboardRepository {
    // 1. 월별 오버뷰 조회
    pub fn get_monthly_overview(conn: &Connection, year_month: &str) -> Result<MonthlyOverview> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        // 총 수입
        let total_income: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE type = 0 AND date BETWEEN ?1 AND ?2",
            params![start_date, end_date],
            |row| row.get(0),
        )?;

        // 총 지출
        let total_expense: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE type = 1 AND date BETWEEN ?1 AND ?2",
            params![start_date, end_date],
            |row| row.get(0),
        )?;

        // 고정비
        let fixed_expense: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE type = 1 AND is_fixed = 1 AND date BETWEEN ?1 AND ?2",
            params![start_date, end_date],
            |row| row.get(0),
        )?;

        // 고정비 비율 계산
        let fixed_expense_ratio = if total_expense > 0.0 {
            (fixed_expense / total_expense) * 100.0
        } else {
            0.0
        };

        Ok(MonthlyOverview {
            total_income,
            total_expense,
            net_income: total_income - total_expense,
            fixed_expense,
            fixed_expense_ratio,
        })
    }

    // 2. 카테고리별 지출 조회
    pub fn get_category_transactions(
        conn: &Connection,
        year_month: &str,
        tx_type: i32, // 0: income, 1: expense
    ) -> Result<Vec<CategoryExpense>> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        // 총 지출 조회
        let total_amount: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE type = ?1 AND date BETWEEN ?2 AND ?3",
            params![tx_type, start_date, end_date],
            |row| row.get(0),
        )?;

        // 카테고리별 지출 조회
        let query = "
            SELECT 
                c.id,
                c.name,
                c.icon,
                COALESCE(SUM(t.amount), 0) as total,
                COUNT(t.id) as count
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id 
                AND t.type = ?1 
                AND t.date BETWEEN ?2 AND ?3
            WHERE c.type = ?1
            GROUP BY c.id, c.name, c.icon
            HAVING total > 0
            ORDER BY total DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![tx_type, start_date, end_date], |row| {
            let category_total: f64 = row.get(3)?;
            let percentage = if total_amount > 0.0 {
                (category_total / total_amount) * 100.0
            } else {
                0.0
            };

            Ok(CategoryExpense {
                category_id: row.get(0)?,
                category_name: row.get(1)?,
                category_icon: row.get(2)?,
                total_amount: category_total,
                percentage,
                transaction_count: row.get(4)?,
            })
        })?;

        rows.collect()
    }

    // 3. 일별 지출 조회
    pub fn get_daily_expenses(conn: &Connection, year_month: &str) -> Result<Vec<DailyExpense>> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        let query = "
            SELECT 
                date,
                COALESCE(SUM(amount), 0) as total,
                COUNT(id) as count
            FROM transactions
            WHERE type = 1 AND date BETWEEN ?1 AND ?2
            GROUP BY date
            ORDER BY date ASC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(DailyExpense {
                date: row.get(0)?,
                total_amount: row.get(1)?,
                transaction_count: row.get(2)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_daily_expenses_by_range(
        conn: &Connection,
        start_date: &str,
        end_date: &str,
    ) -> Result<Vec<DailyExpense>> {
        // Recursive CTE: 시작일부터 종료일까지 빈 날짜 없이 생성 후 LEFT JOIN
        let query = "
            WITH RECURSIVE dates(d) AS (
                VALUES(?)
                UNION ALL
                SELECT date(d, '+1 day') FROM dates WHERE d < ?
            )
            SELECT 
                d as date,
                COALESCE(SUM(t.amount), 0) as total_amount,
                COUNT(t.id) as transaction_count
            FROM dates
            LEFT JOIN transactions t ON d = t.date AND t.type = 1
            GROUP BY d
            ORDER BY d ASC;
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(DailyExpense {
                date: row.get(0)?,
                total_amount: row.get(1)?,
                transaction_count: row.get(2)?,
            })
        })?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    pub fn get_recent_transactions(
        conn: &Connection,
        year_month: &str,
        limit: i32,
    ) -> Result<Vec<TransactionWithCategory>> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month); // SQLite는 존재하지 않는 날짜(31일)도 범위 끝으로 잘 처리합니다.

        let query = "
            SELECT 
                t.id, t.description, t.amount, t.date, t.type, t.is_fixed, t.remarks, t.category_id,
                c.name as category_name,
                c.icon as category_icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.type = 1 AND t.date BETWEEN ?1 AND ?2
            ORDER BY t.date DESC, t.id DESC
            LIMIT ?3;
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![start_date, end_date, limit], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
                category_name: row.get(8)?,
                category_icon: row.get(9)?,
            })
        })?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    // 4. 월별 수입/지출 추이 조회 (최근 N개월)
    pub fn get_monthly_transactions(conn: &Connection, months: i32, tx_type: i32) -> Result<Vec<MonthlyExpense>> {
        let query = "
            SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(amount), 0) as total,
                COUNT(id) as count
            FROM transactions
            WHERE type = ?1 
                AND date >= date('now', 'start of month', '-' || ?2 || ' months')
            GROUP BY month
            ORDER BY month ASC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![tx_type, months - 1], |row| {
            Ok(MonthlyExpense {
                year_month: row.get(0)?,
                total_amount: row.get(1)?,
                transaction_count: row.get(2)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_amount_sum_by_range(
        conn: &Connection,
        tx_type: i32, // 0: income, 1: expense
        start: &str,
        end: &str,
    ) -> Result<i64, rusqlite::Error> {
        let query = "
            SELECT COALESCE(CAST(SUM(amount) AS INTEGER), 0)
            FROM transactions
            WHERE type = ?1
              AND date BETWEEN ?2 AND ?3
        ";

        conn.query_row(query, params![tx_type, start, end], |row| row.get(0))
    }

    pub fn get_fixed_expense_sum_by_range(
        conn: &Connection,
        start: &str,
        end: &str,
    ) -> Result<i64, rusqlite::Error> {
        let query = "
            SELECT COALESCE(CAST(SUM(amount) AS INTEGER), 0)
            FROM transactions
            WHERE type = 1
              AND is_fixed = 1
              AND date BETWEEN ?1 AND ?2
        ";

        conn.query_row(query, params![start, end], |row| row.get(0))
    }

    pub fn get_top_transactions(
        conn: &Connection,
        year_month: &str, // 형식: "YYYY-MM"
        limit: i32,
        tx_type: i32, // 0: income 1: expense
        only_fixed: bool, // true: fixed cost only false: all
    ) -> Result<Vec<TransactionWithCategory>> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        // 고정 항목 필터 조건 동적 생성
        let fixed_filter = if only_fixed { "AND t.is_fixed = 1" } else { "" };

        let query = format!("
        SELECT 
            t.id, t.description, t.amount, t.date, t.type, t.is_fixed, t.remarks, t.category_id,
            c.name as category_name,
            c.icon as category_icon
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.type = ?1 
          {} 
          AND t.date BETWEEN ?2 AND ?3
        ORDER BY t.amount DESC, t.id DESC
        LIMIT ?4
        ", fixed_filter);

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params![tx_type, start_date, end_date, limit], |row| {
        Ok(TransactionWithCategory {
            id: row.get(0)?,
            description: row.get(1)?,
            amount: row.get(2)?,
            date: row.get(3)?,
            r#type: row.get(4)?,
            is_fixed: row.get(5)?,
            remarks: row.get(6)?,
            category_id: row.get(7)?,
            category_name: row.get(8)?,
            category_icon: row.get(9)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_transactions_by_year(
        conn: &Connection,
        year: i32,
    ) -> Result<Vec<MonthlyTransactionRaw>, rusqlite::Error> {
        let query = "
            SELECT
                strftime('%Y-%m', date) as year_month,
                amount,
                type,
                is_fixed
            FROM transactions
            WHERE strftime('%Y', date) = ?1
            ORDER BY year_month ASC, date ASC;
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![year.to_string()], |row| {
            Ok(MonthlyTransactionRaw {
                year_month: row.get(0)?,
                amount: row.get(1)?,
                r#type: row.get(2)?,
                is_fixed: row.get(3)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_monthly_category_amounts_for_year(
        conn: &Connection,
        year: i32,
        category_id: Option<i64>,
    ) -> Result<Vec<CategoryMonthlyAmount>, rusqlite::Error> {
        let mut query = String::from(
            "SELECT 
                strftime('%Y-%m', t.date) as year_month,
                c.id as category_id,
                c.name as category_name,
                c.icon as category_icon,
                SUM(t.amount) as total_amount,
                t.type
            FROM transactions t
            INNER JOIN categories c ON t.category_id = c.id
            WHERE strftime('%Y', t.date) = ?1
            ",
        );

        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(year.to_string())];

        if let Some(cat_id) = category_id {
            query.push_str(" AND c.id = ?2");
            params.push(Box::new(cat_id));
        }

        query.push_str(
            " GROUP BY year_month, c.id, c.name, c.icon, t.type
              ORDER BY year_month ASC, t.type ASC, total_amount DESC
            ",
        );

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|p| p.as_ref())), |row| {
            Ok(CategoryMonthlyAmount {
                year_month: row.get(0)?,
                category_id: row.get(1)?,
                category_name: row.get(2)?,
                category_icon: row.get(3)?,
                total_amount: row.get(4)?,
                r#type: row.get(5)?,
            })
        })?;

        rows.collect()
    }
}

pub struct RecurringTransactionRepository;

impl RecurringTransactionRepository {
    pub fn get_by_id(conn: &Connection, id: i32) -> Result<Option<RecurringTransaction>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT 
                id, description, amount, category_id, frequency,
                start_date, end_date, day_of_month, day_of_week,
                is_active, last_created_date, remarks
            FROM recurring_transactions
            WHERE id = ?1",
            )
            .map_err(|e| e.to_string())?;

        let result = stmt.query_row(params![id], |row| {
            Ok(RecurringTransaction {
                id: Some(row.get(0)?),
                description: row.get(1)?,
                amount: row.get(2)?,
                category_id: row.get(3)?,
                frequency: RecurringFrequency::from(row.get::<_, i32>(4)?),
                start_date: row.get(5)?,
                end_date: row.get(6)?,
                day_of_month: row.get(7)?,
                day_of_week: row.get(8)?,
                is_active: row.get::<_, i32>(9)? == 1,
                last_created_date: row.get(10)?,
                remarks: row.get(11)?,
            })
        });

        match result {
            Ok(recurring) => Ok(Some(recurring)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    // 반복 지출 목록 조회
    pub fn get_all(conn: &Connection) -> Result<Vec<RecurringTransaction>> {
        let query = "
            SELECT 
                id, description, amount, category_id, frequency,
                start_date, end_date, day_of_month, day_of_week,
                is_active, last_created_date, remarks
            FROM recurring_transactions
            ORDER BY is_active DESC, created_at DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |row| {
            Ok(RecurringTransaction {
                id: Some(row.get(0)?),
                description: row.get(1)?,
                amount: row.get(2)?,
                category_id: row.get(3)?,
                frequency: RecurringFrequency::from(row.get::<_, i32>(4)?),
                start_date: row.get(5)?,
                end_date: row.get(6)?,
                day_of_month: row.get(7)?,
                day_of_week: row.get(8)?,
                is_active: row.get::<_, i32>(9)? == 1,
                last_created_date: row.get(10)?,
                remarks: row.get(11)?,
            })
        })?;

        rows.collect()
    }

    // 활성화된 반복 지출만 조회
    pub fn get_active(conn: &Connection) -> Result<Vec<RecurringTransaction>> {
        let query = "
            SELECT 
                id, description, amount, category_id, frequency,
                start_date, end_date, day_of_month, day_of_week,
                is_active, last_created_date, remarks
            FROM recurring_transactions
            WHERE is_active = 1
            ORDER BY created_at DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |row| {
            Ok(RecurringTransaction {
                id: Some(row.get(0)?),
                description: row.get(1)?,
                amount: row.get(2)?,
                category_id: row.get(3)?,
                frequency: RecurringFrequency::from(row.get::<_, i32>(4)?),
                start_date: row.get(5)?,
                end_date: row.get(6)?,
                day_of_month: row.get(7)?,
                day_of_week: row.get(8)?,
                is_active: row.get::<_, i32>(9)? == 1,
                last_created_date: row.get(10)?,
                remarks: row.get(11)?,
            })
        })?;

        rows.collect()
    }

    // 반복 지출 생성
    pub fn create(conn: &Connection, recurring: &RecurringTransaction) -> Result<i64> {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "INSERT INTO recurring_transactions 
            (description, amount, category_id, frequency, start_date, end_date,
             day_of_month, day_of_week, is_active, remarks, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                recurring.description,
                recurring.amount,
                recurring.category_id,
                recurring.frequency as i32,
                recurring.start_date,
                recurring.end_date,
                recurring.day_of_month,
                recurring.day_of_week,
                if recurring.is_active { 1 } else { 0 },
                recurring.remarks,
                now,
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    // 반복 지출 수정
    pub fn update(conn: &Connection, id: i32, recurring: &RecurringTransaction) -> Result<()> {
        conn.execute(
            "UPDATE recurring_transactions 
            SET description = ?1, amount = ?2, category_id = ?3, frequency = ?4,
                start_date = ?5, end_date = ?6, day_of_month = ?7, day_of_week = ?8,
                is_active = ?9, remarks = ?10
            WHERE id = ?11",
            params![
                recurring.description,
                recurring.amount,
                recurring.category_id,
                recurring.frequency as i32,
                recurring.start_date,
                recurring.end_date,
                recurring.day_of_month,
                recurring.day_of_week,
                if recurring.is_active { 1 } else { 0 },
                recurring.remarks,
                id,
            ],
        )?;

        Ok(())
    }

    // 반복 지출 삭제
    pub fn delete(conn: &Connection, id: i32) -> Result<()> {
        conn.execute(
            "DELETE FROM recurring_transactions WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    // 활성화/비활성화 토글
    pub fn toggle_active(conn: &Connection, id: i32) -> Result<()> {
        conn.execute(
            "UPDATE recurring_transactions 
            SET is_active = NOT is_active
            WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    // 마지막 생성일 업데이트
    pub fn update_last_created_date(conn: &Connection, id: i32, date: &str) -> Result<()> {
        conn.execute(
            "UPDATE recurring_transactions 
            SET last_created_date = ?1
            WHERE id = ?2",
            params![date, id],
        )?;
        Ok(())
    }
}