use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init_db(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

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
        ",
    )?;

    Ok(conn)
}