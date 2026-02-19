pub mod app;
pub mod category;
pub mod dashboard;
pub mod db;
pub mod recurring;
pub mod settings;
pub mod transaction;
pub mod onedrive;

use tauri::Runtime;

pub fn register_handler<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        //onedrive
        onedrive::onedrive_login,
        onedrive::onedrive_logout,
        onedrive::onedrive_backup,
        onedrive::onedrive_restore,
        onedrive::onedrive_check_status,
        //transaction
        transaction::create_transaction,
        transaction::get_transactions,
        transaction::get_transactions_with_category,
        transaction::update_transaction,
        transaction::delete_transaction,
        transaction::delete_bulk_transactions,
        transaction::get_transactions_by_date,
        transaction::get_transactions_by_month_and_category,
        transaction::get_all_daily_summaries,
        transaction::get_all_monthly_total_trends,
        transaction::get_filtered_transactions_command,
        transaction::parse_transaction_file,
        transaction::generate_excel_template,
        transaction::bulk_create_transactions,
        //category
        category::create_category,
        category::get_categories,
        category::update_category,
        category::delete_category,
        //dashboard
        dashboard::get_monthly_overview,
        dashboard::get_category_transactions,
        dashboard::get_daily_expenses,
        dashboard::compare_dashboard,
        dashboard::get_recent_7days_expenses,
        dashboard::get_recent_transactions,
        dashboard::get_top_fixed_expenses,
        dashboard::get_top_variable_expenses,
        dashboard::get_top_incomes,
        dashboard::get_yearly_financial_summary_command,
        dashboard::get_monthly_category_amounts_command,
        dashboard::get_yearly_dashboard_data_command,
        dashboard::get_monthly_financial_summary_command,
        dashboard::get_financial_summary_stats_command,
        dashboard::get_daily_category_transactions,
        dashboard::get_expense_treemap,
        dashboard::get_daily_chart_detail,
        dashboard::get_monthly_fixed_variable_transactions,
        dashboard::get_badge_statistics_command,
        dashboard::get_day_of_week_stats_command,
        dashboard::get_day_of_week_stats_monthly_command,
        //recurring
        recurring::get_recurring_transactions,
        recurring::get_recurring_history,
        recurring::create_recurring_transaction,
        recurring::update_recurring_transaction,
        recurring::delete_recurring_transaction,
        recurring::toggle_recurring_transaction,
        recurring::process_recurring_transactions,
        recurring::process_single_recurring_transaction,
        //db
        db::get_db_path,
        db::backup_db,
        db::open_db_folder,
        db::open_backup_folder,
        db::list_backups,
        db::restore_backup,
        db::delete_backup,
        db::export_transactions_csv,
        db::get_export_path,
        db::open_export_folder,
        db::import_transactions_csv,
        //app
        app::is_app_initialized,
        app::initialize_app,
        app::restart_app,
        app::check_recurring,
        //settings
        settings::get_setting_command,
        settings::set_setting_command,
    ])
}
