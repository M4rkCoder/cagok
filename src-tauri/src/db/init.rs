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

        CREATE TABLE IF NOT EXISTS accounts (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL UNIQUE, 
            icon    TEXT NOT NULL,
            type    INTEGER NOT NULL         -- 0: Cash, 1: Bank(Debit/Savings), 2: Credit, 3: Investment
        );

        INSERT OR IGNORE INTO accounts (id, name, icon, type)
        VALUES (1, 'default', '', 0);

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
            day_of_week   INTEGER GENERATED ALWAYS AS (strftime('%w', date)) VIRTUAL,
            type          INTEGER NOT NULL, -- 0: Income, 1: Expense
            is_fixed      INTEGER NOT NULL DEFAULT 0, -- 0: Variable, 1: Fixed
            remarks       TEXT,
            category_id   INTEGER,
            account_id    INTEGER DEFAULT 1,
            FOREIGN KEY (account_id) REFERENCES accounts(id),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS goals (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT NOT NULL,        -- 중복 허용 (name&target_month로 관리)
            target_amount  REAL NOT NULL,        -- 목표 금액
            current_amount REAL DEFAULT 0,       -- 현재 달성 금액
            target_month   TEXT NOT NULL,        -- 'YYYY-MM'
            category_id    INTEGER,              -- (선택) 특정 카테고리 예산인 경우
            status         INTEGER DEFAULT 0,    -- 0: 진행중, 1: 달성, 2: 삭제/숨김
            parent_goal_id INTEGER,              -- 이전 달에서 복사된 경우 원본 ID 저장
            created_at     TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (parent_goal_id) REFERENCES goals(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            description       TEXT NOT NULL,
            amount            REAL NOT NULL,
            category_id       INTEGER,
            account_id        INTEGER DEFAULT 1,
            frequency         INTEGER NOT NULL,      -- 'daily', 'weekly', 'monthly', 'yearly'
            start_date        TEXT NOT NULL,      -- 시작일
            end_date          TEXT,               -- 종료일 (NULL이면 무제한)
            day_of_month      INTEGER,            -- 월 중 몇일 (monthly의 경우)
            day_of_week       INTEGER,            -- 요일 (weekly의 경우, 0=일요일)
            is_active         INTEGER NOT NULL DEFAULT 1,  -- 활성화 여부
            last_created_date TEXT,               -- 마지막으로 생성된 날짜
            remarks           TEXT,
            created_at        TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_history (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            recurring_id      INTEGER NOT NULL,
            transaction_id    INTEGER NOT NULL,
            created_at        TEXT NOT NULL,
            FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_date_amount ON transactions(date, amount DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date_fixed ON transactions(date, is_fixed);
        CREATE INDEX IF NOT EXISTS idx_goals_month ON goals(target_month);
        CREATE INDEX IF NOT EXISTS idx_transactions_day_of_week ON transactions(day_of_week);
        ",
    )?;

    Ok(conn)
}
