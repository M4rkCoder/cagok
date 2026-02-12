# Tauri Backend API Specification

This document outlines the available Tauri commands (Backend API) for the Finkro application. These commands are invoked from the frontend using `invoke("command_name", { args })`.

> **Note:** For detailed data structure definitions (e.g., `Transaction`, `MonthlyOverview`, `DailySummary`), please refer to **[API_TYPES.md](./API_TYPES.md)**.

## Commands

### 1. Transactions (`src-tauri/src/commands/transaction.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `create_transaction` | Creates a new transaction. | `transaction: Transaction` | `i64` (ID) | `1` | `src/store/useTransactionStore.ts` (submitForm) |
| `get_transactions` | Retrieves all transactions. | None | `Vec<Transaction>` | `[{"id":1, ...}]` | *(Unused)* |
| `get_transactions_with_category` | Retrieves all transactions with category details. | None | `Vec<TransactionWithCategory>` | `[{"id":1, "category_name":"Food", ...}]` | *(Unused)* |
| `update_transaction` | Updates an existing transaction. | `id: i64`, `transaction: Transaction` | `()` | `null` | `src/store/useTransactionStore.ts` (submitForm) |
| `delete_transaction` | Deletes a transaction. | `id: i64` | `()` | `null` | `src/store/useTransactionStore.ts` (deleteTransaction) |
| `get_transactions_by_date` | Retrieves transactions for a specific date. | `date: String` (YYYY-MM-DD) | `Vec<TransactionWithCategory>` | `[{"id":1, "date":"2024-01-01", ...}]` | `src/store/useTransactionStore.ts` (fetchTransactionsByDate) |
| `get_all_daily_summaries` | Retrieves daily summaries for all time. | None | `Vec<DailySummary>` | `[{"date":"2024-01-01", "income_total": 0, ...}]` | `src/store/useTransactionStore.ts` (fetchAllDailySummaries) |
| `get_all_monthly_total_trends` | Retrieves monthly total trends for all time. | None | `Vec<MonthlyTotalSummary>` | `[{"year_month":"2024-01", "income_total": 0, ...}]` | `src/store/useTransactionStore.ts` (fetchMonthlyTotalTrends) |
| `get_transactions_by_month_and_category` | Retrieves transactions for a specific month and category. | `year_month: String`, `category_id: i64` | `Vec<TransactionWithCategory>` | `[{"id":1, ...}]` | *(Unused)* |
| `get_filtered_transactions_command` | Retrieves transactions based on filters. | `filters: TransactionFilters` | `Vec<TransactionWithCategory>` | `[{"id":1, ...}]` | `src/store/useTransactionStore.ts` (fetchFilteredAll) |

### 2. Categories (`src-tauri/src/commands/category.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `create_category` | Creates a new category. | `category: Category` | `i64` (ID) | `5` | `src/store/useCategoryStore.ts` (addCategory, submitCategoryForm) |
| `get_categories` | Retrieves all categories. | None | `Vec<Category>` | `[{"id":1, "name":"Food", "icon":"🍔", "type":1}]` | `src/store/useAppStore.ts` (fetchCategories),<br>`src/pages/settings/RecurringSettings.tsx` (loadData) |
| `update_category` | Updates an existing category. | `id: i64`, `category: Category` | `()` | `null` | `src/store/useCategoryStore.ts` (updateCategory, submitCategoryForm) |
| `delete_category` | Deletes a category. | `id: i64` | `()` | `null` | `src/store/useCategoryStore.ts` (deleteCategory) |

### 3. Dashboard & Statistics (`src-tauri/src/commands/dashboard.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `get_monthly_overview` | Get high-level stats for a month (income, expense, net). | `year_month: String` | `MonthlyOverview` | `{"total_income": 5000, "total_expense": 2000, ...}` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_category_transactions` | Get category-wise expense/income summary for a month. | `year_month: String`, `tx_type: i32` | `Vec<CategoryExpense>` | `[{"category_name":"Food", "total_amount": 1000, ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_daily_expenses` | Get daily expense totals for a month. | `year_month: String` | `Vec<DailyExpense>` | `[{"date":"2024-01-01", "total_amount": 500, ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_daily_category_transactions` | Get daily category-wise breakdown. | `year_month: String`, `tx_type: i32` | `Vec<DailyCategoryTransaction>` | `[{"date":"2024-01-01", "category_name":"Food", ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_yearly_financial_summary_command` | Get yearly summary for N years back. | `years_to_look_back: i32` | `Vec<YearlySummaryItem>` | `[{"year": 2024, "total_income": 50000, ...}]` | *(Unused)* |
| `get_monthly_financial_summary_command` | Get monthly summary for a specific year (base_month). | `base_month: String` | `Vec<MonthlyFinancialSummaryItem>` | `[{"year_month":"2024-01", ...}]` | *(Unused)* |
| `get_financial_summary_stats_command` | Get aggregate stats for a year (total, avg, min, max). | `base_month: String` | `FinancialSummaryStats` | `{"income": {"total": 5000, ...}, ...}` | *(Unused)* |
| `get_monthly_category_amounts_command` | Get monthly amounts for a specific category in a year. | `base_month: String`, `category_id: Option<i64>` | `Vec<CategoryMonthlyAmount>` | `[{"year_month":"2024-01", "total_amount": 500, ...}]` | `src/store/useStatisticsStore.ts` (loadCategoryTrend) |
| `compare_dashboard` | Compares metrics between two periods. | `comparison_type: ComparisonType`, `current_start: String`, `current_end: String`, ... | `ComparisonMetric` | `{"current": 100, "previous": 80, "diff": 20, "diff_rate": 25.0}` | `src/lib/api/dashbaord.ts` (getPeriodComparison) -> `useDashboardStore.ts` |
| `get_recent_7days_expenses` | Get expenses for the last 7 days. | `year_month: String` | `Vec<DailyExpense>` | `[{"date":"2024-01-07", "total_amount": 300, ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_recent_transactions` | Get N most recent transactions. | `year_month: String`, `limit: i32` | `Vec<TransactionWithCategory>` | `[{"id": 10, "description": "Coffee", ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_top_fixed_expenses` | Get top fixed expenses. | `year_month: String`, `limit: i32` | `Vec<TransactionWithCategory>` | `[{"id": 5, "description": "Rent", ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_top_variable_expenses` | Get top variable expenses. | `year_month: String`, `limit: i32` | `Vec<TransactionWithCategory>` | `[{"id": 6, "description": "Snack", ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_top_incomes` | Get top income transactions. | `year_month: String`, `limit: i32` | `Vec<TransactionWithCategory>` | `[{"id": 1, "description": "Salary", ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_yearly_dashboard_data_command` | Get comprehensive yearly dashboard data. | `base_month: String` | `YearlyDashboardData` | `{"financialSummaryStats": {...}, ...}` | `src/store/useStatisticsStore.ts` (loadYearlyStatistics) |
| `get_expense_treemap` | Get treemap data for expenses. | `year_month: String` | `TreemapNode` | `{"name": "root", "children": [...]}` | `src/store/useDashboardStore.ts` (loadDashboardData) |
| `get_daily_chart_detail` | Get detailed transactions for a specific day/category. | `date: String`, `tx_type: i32`, `category_id: Option<i64>` | `DailyDetailResponse` | `{"items": [...], "total_amount": 500}` | `src/store/useDashboardStore.ts` (loadChartDetail) |
| `get_monthly_fixed_variable_transactions` | Get fixed vs variable breakdown. | `year_month: String` | `Vec<CategoryFixedVariableSummary>` | `[{"category_name": "Food", "fixed_total": 0, ...}]` | `src/store/useDashboardStore.ts` (loadDashboardData) |

### 4. Settings & App (`src-tauri/src/commands/settings.rs`, `src-tauri/src/commands/app.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `get_setting_command` | Retrieves a specific app setting. | `key: String` | `Option<String>` | `"KRW"` | `src/store/useAppStore.ts` (initApp),<br>`src/pages/settings/GeneralSettings.tsx` (loadSettings) |
| `set_setting_command` | Updates a specific app setting. | `key: String`, `value: String` | `()` | `null` | `src/store/useAppStore.ts` (updateSetting, initApp),<br>`src/pages/settings/GeneralSettings.tsx` (handleSaveSettings) |
| `is_app_initialized` | Checks if the app has been initialized. | None | `bool` | `true` | `src/App.tsx` (checkInitialization) |
| `initialize_app` | Initializes the app with default settings. | `app_name: String`, `language: String`, ... | `()` | `null` | `src/pages/Onboarding.tsx` (handleStart) |
| `restart_app` | Restarts the application. | None | `()` | `null` | `src/pages/settings/DbSettings.tsx` (ConfirmDialog.onConfirm) |
| `check_recurring` | Checks and processes recurring transactions. | None | `()` | `null` | `src/hooks/useRecurringListener.ts` (init) |

### 5. Database & Backup (`src-tauri/src/commands/db.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `get_db_path` | Gets the path to the database file. | None | `String` | `"/Users/user/AppData/..."` | `src/pages/settings/DbSettings.tsx` (useEffect) |
| `backup_db` | Creates a backup of the database. | None | `String` (Backup Path) | `"/Users/user/.../backup.db"` | `src/pages/settings/DbSettings.tsx` (handleBackup) |
| `list_backups` | Lists available backups. | None | `Vec<String>` | `["backup_20240101.db", ...]` | `src/pages/settings/DbSettings.tsx` (fetchBackups) |
| `restore_backup` | Restores the database from a backup file. | `filename: String` | `()` | `null` | `src/pages/settings/DbSettings.tsx` (ConfirmDialog.onConfirm) |
| `open_db_folder` | Opens the database folder in file explorer. | None | `()` | `null` | `src/pages/settings/DbSettings.tsx` (openDbFolder) |
| `delete_backup` | Deletes a backup file. | `filename: String` | `()` | `null` | `src/pages/settings/DbSettings.tsx` (ConfirmDialog.onConfirm) |
| `export_transactions_csv` | Exports transactions to a CSV file. | None | `String` (File Path) | `"/Users/user/.../export.csv"` | `src/pages/settings/DbSettings.tsx` (onClick) |
| `get_export_path` | Gets the path to the export folder. | None | `String` | `"/Users/user/.../Exports"` | `src/pages/settings/DbSettings.tsx` (useEffect) |
| `open_export_folder` | Opens the export folder in file explorer. | None | `()` | `null` | `src/pages/settings/DbSettings.tsx` (onClick) |
| `import_transactions_csv` | Imports transactions from a CSV file. | `path: String` | `u32` (Count) | `50` | `src/pages/settings/CsvImportCard.tsx` (importCsv),<br>`src/pages/settings/CsvPreviewer.tsx` (handleUpload) |

### 6. Recurring Transactions (`src-tauri/src/commands/recurring.rs`)

| Command | Description | Parameters | Return Type | Example Return | Usage (Frontend) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `get_recurring_transactions` | Retrieves all recurring transactions. | None | `Vec<RecurringTransaction>` | `[{"id": 1, "frequency": 2, ...}]` | `src/pages/settings/RecurringSettings.tsx` (loadData) |
| `create_recurring_transaction` | Creates a new recurring transaction. | `recurring: RecurringTransaction` | `i64` (ID) | `10` | `src/pages/settings/RecurringSettings.tsx` (handleCreate) |
| `update_recurring_transaction` | Updates an existing recurring transaction. | `id: i32`, `recurring: RecurringTransaction` | `()` | `null` | `src/pages/settings/RecurringSettings.tsx` (handleUpdate) |
| `delete_recurring_transaction` | Deletes a recurring transaction. | `id: i32` | `()` | `null` | `src/pages/settings/RecurringSettings.tsx` (handleDelete) |
| `toggle_recurring_transaction` | Toggles the active status of a recurring transaction. | `id: i32` | `()` | `null` | `src/pages/settings/RecurringSettings.tsx` (handleToggle) |
| `process_recurring_transactions` | Manually triggers processing of recurring transactions. | None | `i32` (Count) | `2` | *(Unused directly)* |
| `process_single_recurring_transaction` | Manually processes a single recurring transaction. | `recurring_id: i32` | `i32` (Count) | `1` | `src/pages/settings/RecurringSettings.tsx` (handleProcessSingleRecurring) |
