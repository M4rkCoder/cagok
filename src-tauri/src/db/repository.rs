use super::{Category, CategoryExpense, CategoryMonthlyAmount, DailyExpense, MonthlyOverview, RecurringFrequency, RecurringTransaction, Transaction, TransactionWithCategory, MonthlyTransactionRaw, DailyCategoryTransaction, DailySummary, MonthlyTotalSummary, DailyDetailResponse, TransactionFilters, BadgeStats, MonthAmountStat, CategoryStat, DayOfWeekStat, DayOfWeekCategoryStat, DayOfWeekTotalStat, DayOfWeekResponse, RecurringHistoryItem};
use rusqlite::{params, Connection, Result, ToSql, OptionalExtension};

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
        let mut stmt = conn.prepare("SELECT id, description, amount, date, type, is_fixed, remarks, category_id FROM transactions ORDER BY date DESC")?;
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

    pub fn get_daily_summaries_all_time(conn: &Connection) -> Result<Vec<DailySummary>> {
        let query = "
            SELECT 
                date,
                SUM(CASE WHEN type = 0 THEN amount ELSE 0 END) as income_total,
                SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as expense_total,
                COUNT(CASE WHEN type = 0 THEN id END) as income_count,
                COUNT(CASE WHEN type = 1 THEN id END) as expense_count,
                COUNT(id) as total_count
            FROM transactions
            GROUP BY date
            ORDER BY date DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |row| {
            Ok(DailySummary {
                date: row.get(0)?,
                income_total: row.get(1)?,
                expense_total: row.get(2)?,
                income_count: row.get(3)?,
                expense_count: row.get(4)?,
                total_count: row.get(5)?,
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

    pub fn delete_bulk(conn: &Connection, ids: Vec<i64>) -> Result<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
        let query = format!(
            "DELETE FROM transactions WHERE id IN ({})",
            placeholders.join(",")
        );

        let params_refs: Vec<&dyn ToSql> = ids.iter().map(|id| id as &dyn ToSql).collect();

        conn.execute(&query, &params_refs[..])?;

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

    pub fn get_monthly_total_trends_all_time(
        conn: &Connection
    ) -> Result<Vec<MonthlyTotalSummary>> {
        let query = "
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 0 THEN amount ELSE 0 END) as income_total,
                SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as expense_total,
                COUNT(CASE WHEN type = 0 THEN id END) as income_count,
                COUNT(CASE WHEN type = 1 THEN id END) as expense_count,
                COUNT(id) as total_count
            FROM transactions
            GROUP BY month
            ORDER BY month ASC
        ";
    
        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |row| {
            Ok(MonthlyTotalSummary {
                year_month: row.get(0)?,
                income_total: row.get(1)?,
                expense_total: row.get(2)?,
                income_count: row.get(3)?,
                expense_count: row.get(4)?,
                total_count: row.get(5)?,
            })
        })?;
    
        rows.collect()
    }

    pub fn get_filtered_transactions(
        conn: &Connection,
        f: TransactionFilters,
    ) -> Result<Vec<TransactionWithCategory>> {
        let mut query = String::from("
            SELECT 
                t.id, t.description, t.amount, t.date, t.type,
                t.is_fixed, t.remarks, t.category_id,
                c.name, c.icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE 1=1
        ");
    
        let mut params: Vec<Box<dyn ToSql>> = Vec::new();
    
        // 키워드 검색 (Description + Remarks)
        if let Some(keyword) = f.keyword {
            if !keyword.is_empty() {
                query.push_str(" AND (t.description LIKE ? OR t.remarks LIKE ?)");
                let pattern = format!("%{}%", keyword);
                params.push(Box::new(pattern.clone()));
                params.push(Box::new(pattern));
            }
        }
    
        // 타입 검색 (0: 수입, 1: 지출)
        if let Some(tx_type) = f.tx_type {
            query.push_str(" AND t.type = ?");
            params.push(Box::new(tx_type));
        }

        if let Some(fixed) = f.is_fixed {
            query.push_str(" AND t.is_fixed = ?");
            // SQLite는 bool을 0, 1로 처리하므로 변환해서 바인딩
            params.push(Box::new(if fixed { 1 } else { 0 }));
        }
    
        // 카테고리 다중 선택
        if let Some(ids) = f.category_ids {
            if !ids.is_empty() {
                let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
                query.push_str(&format!(" AND t.category_id IN ({})", placeholders.join(",")));
                for id in ids {
                    params.push(Box::new(id));
                }
            }
        }
    
        // 기간 검색
        if let Some(start) = f.start_date {
            query.push_str(" AND t.date >= ?");
            params.push(Box::new(start));
        }
        if let Some(end) = f.end_date {
            query.push_str(" AND t.date <= ?");
            params.push(Box::new(end));
        }
    
        // 금액 범위
        if let Some(min) = f.min_amount {
            query.push_str(" AND t.amount >= ?");
            params.push(Box::new(min));
        }
        if let Some(max) = f.max_amount {
            query.push_str(" AND t.amount <= ?");
            params.push(Box::new(max));
        }
    
        query.push_str(" ORDER BY t.date DESC, t.id DESC");
    
        let mut stmt = conn.prepare(&query)?;
        
        // Vec<Box<dyn ToSql>>를 &[&dyn ToSql]로 변환하여 실행
        let params_refs: Vec<&dyn ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
        let rows = stmt.query_map(&params_refs[..], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
                category_name: row.get(8).ok(), // LEFT JOIN이므로 null 허용
                category_icon: row.get(9).ok(),
            })
        })?;
    
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
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
            daily_average: 0.0,
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

    pub fn get_daily_category_transactions(
        conn: &Connection,
        year_month: &str,
        tx_type: i32, // 0: income, 1: expense
    ) -> Result<Vec<DailyCategoryTransaction>> {
        let start_date = format!("{}-01", year_month);
    
        let query = "
            SELECT 
                t.date,
                c.id as category_id,
                c.name as category_name,
                c.icon as category_icon,
                COALESCE(SUM(t.amount), 0) as total_amount,
                t.type as tx_type,
                COUNT(t.id) as count
            FROM transactions t
            INNER JOIN categories c ON t.category_id = c.id
            WHERE t.type = ?1 
              AND t.date BETWEEN date(?2) AND date(?2, '+1 month', '-1 day')
            GROUP BY t.date, c.id, c.name, c.icon, t.type
            ORDER BY t.date ASC, total_amount DESC
        ";
    
        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![tx_type, start_date], |row| {
            Ok(DailyCategoryTransaction {
                date: row.get(0)?,
                category_id: row.get(1)?,
                category_name: row.get(2)?,
                category_icon: row.get(3)?,
                total_amount: row.get(4)?,
                tx_type: row.get(5)?,
                transaction_count: row.get(6)?,
            })
        })?;
    
        rows.collect()
    }

    //트리맵용 지출/고정지출 카테고리별 쿼리
    pub fn get_category_sums_by_fixed_status(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<(bool, i64, String, String, f64)>> {
        // 1. 해당 월의 시작일과 마지막 날을 SQLite 함수로 안전하게 처리하기 위해 매개변수 준비
        let start_date = format!("{}-01", year_month);
    
        let query = "
            SELECT 
                t.is_fixed,
                c.id,
                c.name,
                c.icon,
                SUM(t.amount) as total
            FROM transactions t
            INNER JOIN categories c ON t.category_id = c.id
            WHERE t.type = 1 
              AND t.date BETWEEN ?1 AND date(?1, '+1 month', '-1 day') -- 안전한 말일 계산
            GROUP BY t.is_fixed, c.id
            ORDER BY total DESC
        ";
    
        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![start_date], |row| {
            Ok((
                row.get::<_, i32>(0)? == 1, // is_fixed (1이면 true, 0이면 false)
                row.get::<_, i64>(1)?,      // category_id
                row.get::<_, String>(2)?,   // category_name
                row.get::<_, String>(3)?,   // category_icon
                row.get::<_, f64>(4)?,      // total
            ))
        })?;
    
        // Iterator의 Result들을 모아서 하나의 Result<Vec>으로 반환 (함수형 스타일)
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

    pub fn get_transactions_recent_year(
        conn: &Connection,
        base_month: &str, // "YYYY-MM"
    ) -> Result<Vec<MonthlyTransactionRaw>, rusqlite::Error> {
        let query = "
            SELECT
                strftime('%Y-%m', date) as year_month,
                amount,
                type,
                is_fixed
            FROM transactions
            WHERE date >= date(?1 || '-01', '-11 months') 
                AND date <= date(?1 || '-01', '+1 month', '-1 day')
            ORDER BY year_month ASC, date ASC;
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![base_month], |row| {
            Ok(MonthlyTransactionRaw {
                year_month: row.get(0)?,
                amount: row.get(1)?,
                r#type: row.get(2)?,
                is_fixed: row.get(3)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_monthly_category_amounts_recent_year(
        conn: &Connection,
        base_month: &str, // "YYYY-MM" 형식
        category_id: Option<i64>,
    ) -> Result<Vec<CategoryMonthlyAmount>, rusqlite::Error> {
        // 1. 기본 쿼리 작성 (범위 기반 날짜 필터링)
        let mut query = String::from(
            "SELECT 
                strftime('%Y-%m', t.date) as year_month,
                c.id as category_id,
                c.name as category_name,
                c.icon as category_icon,
                SUM(t.amount) as total_amount,
                COUNT(t.id) as transaction_count,
                t.type
            FROM transactions t
            INNER JOIN categories c ON t.category_id = c.id
            WHERE t.date >= date(?1 || '-01', '-11 months') 
              AND t.date <= date(?1 || '-01', '+1 month', '-1 day')
            ",
        );
    
        // 2. 파라미터 구성
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(base_month.to_string())];
    
        // 3. 카테고리 필터가 있는 경우 추가
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
                transaction_count: row.get(5)?,
                r#type: row.get(6)?,
            })
        })?;
    
        rows.collect()
    }

    pub fn get_daily_transactions_with_total(
        conn: &Connection,
        date: &str,
        tx_type: i32,
        category_id: Option<i64>,
    ) -> Result<DailyDetailResponse> {
        // 1. 조건에 따른 SQL 필터 정의
        let sql_filter = match category_id {
            Some(_) => "WHERE t.date = ?1 AND t.category_id = ?2",
            None => "WHERE t.date = ?1 AND t.type = ?2",
        };
    
        let query = format!(
            "SELECT 
                t.id, t.description, t.amount, t.date, t.type,
                t.is_fixed, t.remarks, t.category_id,
                c.name, c.icon
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             {} 
             ORDER BY t.amount DESC",
            sql_filter
        );
    
        let mut stmt = conn.prepare(&query)?;
        let mut total_amount = 0.0;
    
        let params_vec: Vec<Box<dyn rusqlite::ToSql>> = match category_id {
            Some(id) => vec![Box::new(date.to_string()), Box::new(id)],
            None => vec![Box::new(date.to_string()), Box::new(tx_type)],
        };
    
        let rows = stmt.query_map(
            rusqlite::params_from_iter(params_vec.iter().map(|p| p.as_ref())),
            |row| {
                let amount: f64 = row.get(2)?;
                Ok(TransactionWithCategory {
                    id: row.get(0)?,
                    description: row.get(1)?,
                    amount,
                    date: row.get(3)?,
                    r#type: row.get(4)?,    // i64
                    is_fixed: row.get(5)?,  // i64
                    remarks: row.get(6)?,
                    category_id: row.get(7)?,
                    category_name: row.get(8)?,
                    category_icon: row.get(9)?,
                })
            }
        )?;
    
        let mut items = Vec::new();
        for row_result in rows {
            let item = row_result?;
            total_amount += item.amount;
            items.push(item);
        }
    
        Ok(DailyDetailResponse { items, total_amount })
    }

    pub fn get_monthly_expense_raw(
        conn: &Connection,
        year_month: &str,
    ) -> Result<Vec<TransactionWithCategory>> {
        let start_date = format!("{}-01", year_month);

        let query = "
            SELECT 
                t.id, t.description, t.amount, t.date, t.type, t.is_fixed, t.remarks, t.category_id,
                c.name, c.icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.type = 1 
              AND t.date BETWEEN ?1 AND date(?1, '+1 month', '-1 day')
            ORDER BY t.date DESC
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![start_date], |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                r#type: row.get(4)?,
                is_fixed: row.get(5)?,
                remarks: row.get(6)?,
                category_id: row.get(7)?,
                category_name: row.get::<_, Option<String>>(8).unwrap_or(Some("미지정".to_string())),
category_icon: row.get::<_, Option<String>>(9).unwrap_or(Some("❓".to_string())),
            })
        })?;

        rows.collect()
    }

    pub fn get_badge_stats(conn: &Connection, base_month: &str) -> Result<BadgeStats> {
        let start_date_sql = "date(?1 || '-01', '-11 months')";
        let end_date_sql = "date(?1 || '-01', '+1 month', '-1 day')";

        // 1. Max Expense Month
        let max_expense_month_query = format!(
            "SELECT strftime('%Y-%m', date) as m, SUM(amount) as total
             FROM transactions
             WHERE type = 1 AND date BETWEEN {} AND {}
             GROUP BY m
             ORDER BY total DESC
             LIMIT 1",
            start_date_sql, end_date_sql
        );
        let max_expense_month: Option<MonthAmountStat> = conn.query_row(
            &max_expense_month_query,
            params![base_month],
            |row| Ok(MonthAmountStat {
                month: row.get(0)?,
                amount: row.get(1)?,
            })
        ).optional()?;

        // 2. Max Income Month
        let max_income_month_query = format!(
            "SELECT strftime('%Y-%m', date) as m, SUM(amount) as total
             FROM transactions
             WHERE type = 0 AND date BETWEEN {} AND {}
             GROUP BY m
             ORDER BY total DESC
             LIMIT 1",
            start_date_sql, end_date_sql
        );
        let max_income_month: Option<MonthAmountStat> = conn.query_row(
            &max_income_month_query,
            params![base_month],
            |row| Ok(MonthAmountStat {
                month: row.get(0)?,
                amount: row.get(1)?,
            })
        ).optional()?;

        // 3. Net Income Ratio
        // Total Income in period
        let total_income: f64 = conn.query_row(
            &format!("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 0 AND date BETWEEN {} AND {}", start_date_sql, end_date_sql),
            params![base_month],
            |row| row.get(0)
        )?;
        // Total Expense in period
        let total_expense: f64 = conn.query_row(
            &format!("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 1 AND date BETWEEN {} AND {}", start_date_sql, end_date_sql),
            params![base_month],
            |row| row.get(0)
        )?;
        
        let net_income_ratio = if total_income > 0.0 {
            ((total_income - total_expense) / total_income) * 100.0
        } else {
            0.0
        };

        // 4. Max Expense Category
        let max_expense_cat_query = format!(
            "SELECT c.name, c.icon, SUM(t.amount) as total
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.type = 1 AND t.date BETWEEN {} AND {}
             GROUP BY c.id
             ORDER BY total DESC
             LIMIT 1",
            start_date_sql, end_date_sql
        );
        let max_expense_category: Option<CategoryStat> = conn.query_row(
            &max_expense_cat_query,
            params![base_month],
            |row| Ok(CategoryStat {
                name: row.get(0)?,
                icon: row.get(1)?,
                value: row.get(2)?,
            })
        ).optional()?;

        // 5. Most Frequent Expense Category
        let most_freq_cat_query = format!(
            "SELECT c.name, c.icon, COUNT(t.id) as cnt
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.type = 1 AND t.date BETWEEN {} AND {}
             GROUP BY c.id
             ORDER BY cnt DESC
             LIMIT 1",
            start_date_sql, end_date_sql
        );
        let most_frequent_category: Option<CategoryStat> = conn.query_row(
            &most_freq_cat_query,
            params![base_month],
            |row| Ok(CategoryStat {
                name: row.get(0)?,
                icon: row.get(1)?,
                value: row.get::<_, i64>(2)? as f64,
            })
        ).optional()?;

        // 6. Max Expense Day of Week
        let max_dow_query = format!(
            "SELECT day_of_week, SUM(amount) as total
             FROM transactions
             WHERE type = 1 AND date BETWEEN {} AND {}
             GROUP BY day_of_week
             ORDER BY total DESC
             LIMIT 1",
            start_date_sql, end_date_sql
        );

        let max_expense_day_of_week: Option<DayOfWeekStat> = conn.query_row(
            &max_dow_query,
            params![base_month],
            |row| {
                let dow_int: i32 = row.get(0)?;
                let dow_str = match dow_int {
                    0 => "일요일",
                    1 => "월요일",
                    2 => "화요일",
                    3 => "수요일",
                    4 => "목요일",
                    5 => "금요일",
                    6 => "토요일",
                    _ => "알 수 없음",
                };
                Ok(DayOfWeekStat {
                    day: dow_str.to_string(),
                    amount: row.get(1)?,
                })
            }
        ).optional()?;

        Ok(BadgeStats {
            max_expense_month,
            max_income_month,
            net_income_ratio,
            max_expense_category,
            most_frequent_category,
            max_expense_day_of_week,
        })
    }

    pub fn get_day_of_week_stats(
        conn: &Connection,
        base_month: &str,
        tx_type: i32,
    ) -> Result<DayOfWeekResponse> {
        let start_date_sql = "date(?1 || '-01', '-11 months')";
        let end_date_sql = "date(?1 || '-01', '+1 month', '-1 day')";

        // 1. Category Stats
        let cat_query = format!(
            "SELECT 
                day_of_week,
                c.id, c.name, c.icon,
                SUM(t.amount) as total_amount,
                COUNT(t.id) as tx_count,
                COUNT(DISTINCT t.date) as day_count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.date BETWEEN {} AND {}
            AND t.type = ?2
            AND c.type = ?2
            GROUP BY day_of_week, c.id
            ORDER BY day_of_week ASC, total_amount DESC",
            start_date_sql, end_date_sql
        );

        let mut stmt = conn.prepare(&cat_query)?;
        let categories = stmt.query_map(params![base_month, tx_type], |row| {
            let total_amount: f64 = row.get(4)?;
            let transaction_count: i64 = row.get(5)?;
            let day_count: i64 = row.get(6)?;
            let average_amount = if transaction_count > 0 {
                total_amount / transaction_count as f64
            } else {
                0.0
            };

            Ok(DayOfWeekCategoryStat {
                day_of_week: row.get(0)?,
                category_id: row.get(1)?,
                category_name: row.get(2)?,
                category_icon: row.get(3)?,
                total_amount,
                transaction_count,
                day_count,
                average_amount,
            })
        })?.collect::<Result<Vec<_>>>()?;

        // 2. Daily Total Stats
        let total_query = format!(
            "SELECT 
                day_of_week,
                SUM(t.amount) as total_amount,
                COUNT(t.id) as tx_count,
                COUNT(DISTINCT t.date) as day_count
            FROM transactions t
            WHERE t.date BETWEEN {} AND {}
            AND t.type = ?2
            GROUP BY day_of_week
            ORDER BY day_of_week ASC",
            start_date_sql, end_date_sql
        );

        let mut stmt = conn.prepare(&total_query)?;
        let totals = stmt.query_map(params![base_month, tx_type], |row| {
            let total_amount: f64 = row.get(1)?;
            let transaction_count: i64 = row.get(2)?;
            let day_count: i64 = row.get(3)?;
            
            // 전체 통계의 평균은 "일평균" (해당 요일의 총액 / 해당 요일의 유효 일수)
            let average_amount = if day_count > 0 {
                total_amount / day_count as f64
            } else {
                0.0
            };

            Ok(DayOfWeekTotalStat {
                day_of_week: row.get(0)?,
                total_amount,
                transaction_count,
                day_count,
                average_amount,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(DayOfWeekResponse {
            categories,
            totals,
        })
    }

    pub fn get_day_of_week_stats_monthly(
        conn: &Connection,
        year_month: &str,
        tx_type: i32,
    ) -> Result<DayOfWeekResponse> {
        let start_date = format!("{}-01", year_month);
        let end_date = format!("{}-31", year_month);

        // 1. Category Stats
        let cat_query = "
            SELECT 
                day_of_week,
                c.id, c.name, c.icon,
                SUM(t.amount) as total_amount,
                COUNT(t.id) as tx_count,
                COUNT(DISTINCT t.date) as day_count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.date BETWEEN ?1 AND ?2
            AND t.type = ?3
            AND c.type = ?3
            GROUP BY day_of_week, c.id
            ORDER BY day_of_week ASC, total_amount DESC
        ";

        let mut stmt = conn.prepare(cat_query)?;
        let categories = stmt.query_map(params![start_date, end_date, tx_type], |row| {
            let total_amount: f64 = row.get(4)?;
            let transaction_count: i64 = row.get(5)?;
            let day_count: i64 = row.get(6)?;
            let average_amount = if transaction_count > 0 {
                total_amount / transaction_count as f64
            } else {
                0.0
            };

            Ok(DayOfWeekCategoryStat {
                day_of_week: row.get(0)?,
                category_id: row.get(1)?,
                category_name: row.get(2)?,
                category_icon: row.get(3)?,
                total_amount,
                transaction_count,
                day_count,
                average_amount,
            })
        })?.collect::<Result<Vec<_>>>()?;

        // 2. Daily Total Stats
        let total_query = "
            SELECT 
                day_of_week,
                SUM(t.amount) as total_amount,
                COUNT(t.id) as tx_count,
                COUNT(DISTINCT t.date) as day_count
            FROM transactions t
            WHERE t.date BETWEEN ?1 AND ?2
            AND t.type = ?3
            GROUP BY day_of_week
            ORDER BY day_of_week ASC
        ";

        let mut stmt = conn.prepare(total_query)?;
        let totals = stmt.query_map(params![start_date, end_date, tx_type], |row| {
            let total_amount: f64 = row.get(1)?;
            let transaction_count: i64 = row.get(2)?;
            let day_count: i64 = row.get(3)?;
            
            // 전체 통계의 평균은 "일평균" (해당 요일의 총액 / 해당 요일의 유효 일수)
            let average_amount = if day_count > 0 {
                total_amount / day_count as f64
            } else {
                0.0
            };

            Ok(DayOfWeekTotalStat {
                day_of_week: row.get(0)?,
                total_amount,
                transaction_count,
                day_count,
                average_amount,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(DayOfWeekResponse {
            categories,
            totals,
        })
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

    // 반복 지출 실행 이력 조회
    pub fn get_history(conn: &Connection, limit: i32) -> Result<Vec<RecurringHistoryItem>> {
        let query = "
            SELECT 
                rh.id,
                rh.recurring_id,
                rh.transaction_id,
                rh.created_at,
                t.amount,
                t.description,
                c.name,
                c.icon,
                COALESCE(c.type, t.type)
            FROM recurring_history rh
            JOIN transactions t ON rh.transaction_id = t.id
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY rh.created_at DESC, rh.id DESC
            LIMIT ?1
        ";

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map(params![limit], |row| {
            Ok(RecurringHistoryItem {
                id: row.get(0)?,
                recurring_id: row.get(1)?,
                transaction_id: row.get(2)?,
                created_at: row.get(3)?,
                amount: row.get(4)?,
                description: row.get(5)?,
                category_name: row.get(6)?,
                category_icon: row.get(7)?,
                category_type: row.get(8)?,
            })
        })?;

        rows.collect()
    }
}