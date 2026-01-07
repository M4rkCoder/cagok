use rusqlite::{params, Connection, Result};
use super::{Transaction, TransactionWithCategory, Category};

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
                transaction: Transaction {

                    id: row.get(0)?,
                    description: row.get(1)?,
                    amount: row.get(2)?,
                    date: row.get(3)?,
                    r#type: row.get(4)?,
                    is_fixed: row.get(5)?,
                    remarks: row.get(6)?,
                    category_id: row.get(7)?,
                },
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
