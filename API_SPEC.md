# API Specification

This document outlines the Tauri commands available in the application. These commands are invoked from the frontend using `invoke`.

## Transaction Commands

### `create_transaction`
Creates a new transaction.
- **Arguments:**
  - `transaction`: `Transaction` object
- **Returns:** `Result<i64, String>` (The ID of the created transaction)

### `get_transactions`
Retrieves all transactions.
- **Arguments:** None
- **Returns:** `Result<Vec<Transaction>, String>`

### `get_transactions_with_category`
Retrieves all transactions with their associated category details.
- **Arguments:** None
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `update_transaction`
Updates an existing transaction.
- **Arguments:**
  - `id`: `i64`
  - `transaction`: `Transaction` object
- **Returns:** `Result<(), String>`

### `delete_transaction`
Deletes a transaction by ID.
- **Arguments:**
  - `id`: `i64`
- **Returns:** `Result<(), String>`

### `get_transactions_by_date`
Retrieves transactions for a specific date.
- **Arguments:**
  - `date`: `String` (YYYY-MM-DD)
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_transactions_by_month_and_category`
Retrieves transactions for a specific month and category.
- **Arguments:**
  - `year_month`: `String` (YYYY-MM)
  - `category_id`: `i64`
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_all_daily_summaries`
Retrieves daily summaries of transactions.
- **Arguments:** None
- **Returns:** `Result<Vec<DailySummary>, String>`

### `get_all_monthly_total_trends`
Retrieves monthly total trends.
- **Arguments:** None
- **Returns:** `Result<Vec<MonthlyTotalSummary>, String>`

### `get_filtered_transactions_command`
Retrieves transactions based on filter criteria.
- **Arguments:**
  - `filters`: `TransactionFilters` object
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `parse_transaction_file`
Parses an Excel file for transaction preview.
- **Arguments:**
  - `path`: `String`
- **Returns:** `Result<Vec<ExcelPreviewRow>, String>`

### `generate_excel_template`
Generates an Excel template for transaction import.
- **Arguments:**
  - `file_path`: `String`
  - `lang`: `String`
- **Returns:** `Result<(), String>`

### `bulk_create_transactions`
Creates multiple transactions at once.
- **Arguments:**
  - `transactions`: `Vec<Transaction>`
- **Returns:** `Result<String, String>`

## Category Commands

### `create_category`
Creates a new category.
- **Arguments:**
  - `category`: `Category` object
- **Returns:** `Result<i64, String>`

### `get_categories`
Retrieves all categories.
- **Arguments:** None
- **Returns:** `Result<Vec<Category>, String>`

### `update_category`
Updates an existing category.
- **Arguments:**
  - `id`: `i64`
  - `category`: `Category` object
- **Returns:** `Result<(), String>`

### `delete_category`
Deletes a category by ID.
- **Arguments:**
  - `id`: `i64`
- **Returns:** `Result<(), String>`

## Dashboard Commands

### `get_monthly_overview`
Retrieves a monthly overview of finances.
- **Arguments:**
  - `year_month`: `String` (YYYY-MM)
- **Returns:** `Result<MonthlyOverview, String>`

### `get_category_transactions`
Retrieves category-wise transaction totals for a month.
- **Arguments:**
  - `year_month`: `String` (YYYY-MM)
  - `tx_type`: `i32` (0: Income, 1: Expense)
- **Returns:** `Result<Vec<CategoryExpense>, String>`

### `get_daily_expenses`
Retrieves daily expense totals for a month.
- **Arguments:**
  - `year_month`: `String` (YYYY-MM)
- **Returns:** `Result<Vec<DailyExpense>, String>`

### `compare_dashboard`
Compares dashboard metrics between two periods.
- **Arguments:**
  - `comparison_type`: `ComparisonType`
  - `current_start`: `String`
  - `current_end`: `String`
  - `previous_start`: `String`
  - `previous_end`: `String`
- **Returns:** `Result<ComparisonMetric, String>`

### `get_recent_7days_expenses`
Retrieves daily expenses for the last 7 days relative to a month.
- **Arguments:**
  - `year_month`: `String`
- **Returns:** `Result<Vec<DailyExpense>, String>`

### `get_recent_transactions`
Retrieves a limited number of recent transactions.
- **Arguments:**
  - `year_month`: `String`
  - `limit`: `i32`
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_top_fixed_expenses`
Retrieves top fixed expenses for a month.
- **Arguments:**
  - `year_month`: `String`
  - `limit`: `i32`
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_top_variable_expenses`
Retrieves top variable expenses for a month.
- **Arguments:**
  - `year_month`: `String`
  - `limit`: `i32`
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_top_incomes`
Retrieves top incomes for a month.
- **Arguments:**
  - `year_month`: `String`
  - `limit`: `i32`
- **Returns:** `Result<Vec<TransactionWithCategory>, String>`

### `get_yearly_financial_summary_command`
Retrieves yearly financial summary.
- **Arguments:**
  - `years_to_look_back`: `i32`
- **Returns:** `Result<Vec<YearlySummaryItem>, String>`

### `get_monthly_financial_summary_command`
Retrieves monthly financial summary for the last year.
- **Arguments:**
  - `base_month`: `String` (YYYY-MM)
- **Returns:** `Result<Vec<MonthlyFinancialSummaryItem>, String>`

### `get_financial_summary_stats_command`
Retrieves financial summary statistics for the last year.
- **Arguments:**
  - `base_month`: `String` (YYYY-MM)
- **Returns:** `Result<FinancialSummaryStats, String>`

### `get_monthly_category_amounts_command`
Retrieves monthly category amounts for the last year.
- **Arguments:**
  - `base_month`: `String`
  - `category_id`: `Option<i64>`
- **Returns:** `Result<Vec<CategoryMonthlyAmount>, String>`

### `get_yearly_dashboard_data_command`
Retrieves comprehensive yearly dashboard data.
- **Arguments:**
  - `base_month`: `String`
- **Returns:** `Result<YearlyDashboardData, String>`

### `get_daily_category_transactions`
Retrieves daily category transaction data for a month.
- **Arguments:**
  - `year_month`: `String`
  - `tx_type`: `i32`
- **Returns:** `Result<Vec<DailyCategoryTransaction>, String>`

### `get_expense_treemap`
Retrieves expense data structured for a treemap.
- **Arguments:**
  - `year_month`: `String`
- **Returns:** `Result<TreemapNode, String>`

### `get_daily_chart_detail`
Retrieves detailed transactions for a specific day and filters.
- **Arguments:**
  - `date`: `String`
  - `tx_type`: `i32`
  - `category_id`: `Option<i64>`
- **Returns:** `Result<DailyDetailResponse, String>`

### `get_monthly_fixed_variable_transactions`
Retrieves monthly transactions summarized by fixed/variable status.
- **Arguments:**
  - `year_month`: `String`
- **Returns:** `Result<Vec<CategoryFixedVariableSummary>, String>`

### `get_badge_statistics_command`
Retrieves badge statistics.
- **Arguments:**
  - `base_month`: `String`
- **Returns:** `Result<BadgeStats, String>`

### `get_day_of_week_stats_command`
Retrieves day of week statistics (yearly range).
- **Arguments:**
  - `base_month`: `String`
  - `tx_type`: `i32`
- **Returns:** `Result<DayOfWeekResponse, String>`

### `get_day_of_week_stats_monthly_command`
Retrieves day of week statistics (monthly range).
- **Arguments:**
  - `base_month`: `String`
  - `tx_type`: `i32`
- **Returns:** `Result<DayOfWeekResponse, String>`

## Recurring Transaction Commands

### `get_recurring_transactions`
Retrieves all recurring transactions.
- **Arguments:** None
- **Returns:** `Result<Vec<RecurringTransaction>, String>`

### `get_recurring_history`
Retrieves recurring transaction history.
- **Arguments:**
  - `limit`: `i32`
- **Returns:** `Result<Vec<RecurringHistoryItem>, String>`

### `create_recurring_transaction`
Creates a new recurring transaction.
- **Arguments:**
  - `recurring`: `RecurringTransaction` object
- **Returns:** `Result<i64, String>`

### `update_recurring_transaction`
Updates an existing recurring transaction.
- **Arguments:**
  - `id`: `i32`
  - `recurring`: `RecurringTransaction` object
- **Returns:** `Result<(), String>`

### `delete_recurring_transaction`
Deletes a recurring transaction.
- **Arguments:**
  - `id`: `i32`
- **Returns:** `Result<(), String>`

### `toggle_recurring_transaction`
Toggles the active status of a recurring transaction.
- **Arguments:**
  - `id`: `i32`
- **Returns:** `Result<(), String>`

### `process_recurring_transactions`
Processes all pending recurring transactions.
- **Arguments:** None
- **Returns:** `Result<i32, String>`

### `process_single_recurring_transaction`
Processes a single recurring transaction immediately.
- **Arguments:**
  - `recurring_id`: `i32`
- **Returns:** `Result<i32, String>`

## Database Commands

### `get_db_path`
Retrieves the current database path.
- **Arguments:** None
- **Returns:** `Result<String, String>`

### `backup_db`
Creates a backup of the database.
- **Arguments:** None
- **Returns:** `Result<String, String>`

### `list_backups`
Lists all available database backups.
- **Arguments:** None
- **Returns:** `Result<Vec<String>, String>`

### `restore_backup`
Restores the database from a backup file.
- **Arguments:**
  - `filename`: `String`
- **Returns:** `Result<(), String>`

### `open_db_folder`
Opens the folder containing the database.
- **Arguments:** None
- **Returns:** `Result<(), String>`

### `open_backup_folder`
Opens the folder containing the database backups.
- **Arguments:** None
- **Returns:** `Result<(), String>`

### `delete_backup`
Deletes a backup file.
- **Arguments:**
  - `filename`: `String`
- **Returns:** `Result<(), String>`

### `export_transactions_csv`
Exports transactions to a CSV file.
- **Arguments:** None
- **Returns:** `Result<String, String>`

### `get_export_path`
Retrieves the export directory path.
- **Arguments:** None
- **Returns:** `Result<String, String>`

### `open_export_folder`
Opens the export directory.
- **Arguments:** None
- **Returns:** `Result<(), String>`

### `import_transactions_csv`
Imports transactions from a CSV file.
- **Arguments:**
  - `path`: `String`
- **Returns:** `Result<u32, String>`

## App Commands

### `is_app_initialized`
Checks if the app has been initialized.
- **Arguments:** None
- **Returns:** `Result<bool, String>`

### `initialize_app`
Initializes the application with settings.
- **Arguments:**
  - `app_name`: `String`
  - `language`: `String`
  - `currency`: `String`
- **Returns:** `Result<(), String>`

### `restart_app`
Restarts the application.
- **Arguments:** None
- **Returns:** `Result<(), String>`

### `check_recurring`
Checks for recurring transactions (async).
- **Arguments:** None
- **Returns:** None (Emits 'recurring-summary' event)

## Settings Commands

### `get_setting_command`
Retrieves a specific setting value.
- **Arguments:**
  - `key`: `String`
- **Returns:** `Result<Option<String>, String>`

### `set_setting_command`
Sets a specific setting value.
- **Arguments:**
  - `key`: `String`
  - `value`: `String`
- **Returns:** `Result<(), String>`
