pub mod category;
pub mod transaction;

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

    ])
}