pub mod category;
pub mod transaction;
pub mod dashboard;
pub mod recurring;

use tauri::Runtime;

pub fn register_handler<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        //transaction
        transaction::create_transaction,
        transaction::get_transactions,
        transaction::get_transactions_with_category,
        transaction::update_transaction,
        transaction::delete_transaction,
        //category
        category::create_category,
        category::get_categories,
        category::update_category,
        category::delete_category,
        //dashboard
        dashboard::get_monthly_overview,
        dashboard::get_category_expenses,
        dashboard::get_daily_expenses,
        dashboard::get_monthly_expenses,
        //recurring
        recurring::get_recurring_transactions,
        recurring::create_recurring_transaction,
        recurring::update_recurring_transaction,
        recurring::delete_recurring_transaction,
        recurring::toggle_recurring_transaction,
        recurring::process_recurring_transactions,
    ])
}