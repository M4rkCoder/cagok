use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            icon        TEXT NOT NULL,
            type        INTEGER NOT NULL -- 0: Income, 1: Expense
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            description   TEXT,
            amount        REAL NOT NULL,
            date          TEXT NOT NULL,
            type          INTEGER NOT NULL, -- 0: Income, 1: Expense
            is_fixed      INTEGER NOT NULL DEFAULT 0, -- 0: Variable, 1: Fixed
            remarks       TEXT,
            category_id   INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            description       TEXT NOT NULL,
            amount            REAL NOT NULL,
            category_id       INTEGER,
            frequency         INTEGER NOT NULL,      -- 'daily', 'weekly', 'monthly', 'yearly'
            start_date        TEXT NOT NULL,      -- 시작일
            end_date          TEXT,               -- 종료일 (NULL이면 무제한)
            day_of_month      INTEGER,            -- 월 중 몇일 (monthly의 경우)
            day_of_week       INTEGER,            -- 요일 (weekly의 경우, 0=일요일)
            is_active         INTEGER NOT NULL DEFAULT 1,  -- 활성화 여부
            last_created_date TEXT,               -- 마지막으로 생성된 날짜
            remarks           TEXT,
            created_at        TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );
        ",
    )?;

    Ok(conn)
}