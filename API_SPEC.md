# API Specification

This document lists all available Tauri commands, their purpose, return types, and frontend usage.

| Command | Purpose | Return Type | Frontend Usage (Store/Component) |
| :--- | :--- | :--- | :--- |
| **App** | | | |
| `is_app_initialized` | Check if the application is initialized. | `bool` | `App.tsx` |
| `initialize_app` | Initialize application settings (name, language, currency). | `()` | `Onboarding.tsx` |
| `restart_app` | Restart the application. | `()` | `DbSettings.tsx` |
| `check_recurring` | Check and process recurring transactions. Emits `recurring-summary` event. | `()` | `useRecurringListener.ts` |
| **Category** | | | |
| `create_category` | Create a new category. | [`i64`](API_TYPES.md#category) | `useCategoryStore` |
| `get_categories` | Get all categories. | [`Vec<Category>`](API_TYPES.md#category) | `useAppStore`, `RecurringSettings` |
| `update_category` | Update an existing category. | `()` | `useCategoryStore` |
| `delete_category` | Delete a category. | `()` | `useCategoryStore` |
| **Dashboard** | | | |
| `get_monthly_overview` | Get overview statistics for a specific month. | [`MonthlyOverview`](API_TYPES.md#monthlyoverview) | `useDashboardStore` |
| `get_category_transactions` | Get aggregated transaction data by category for a month. | [`Vec<CategoryExpense>`](API_TYPES.md#categoryexpense) | `useDashboardStore` |
| `get_daily_expenses` | Get daily expense totals for a month. | [`Vec<DailyExpense>`](API_TYPES.md#dailyexpense) | `useDashboardStore` |
| `get_daily_category_transactions` | Get aggregated transaction data by day and category. | [`Vec<DailyCategoryTransaction>`](API_TYPES.md#dailycategorytransaction) | `useDashboardStore` |
| `get_yearly_financial_summary_command` | Get financial summary for the last N years. | [`Vec<YearlySummaryItem>`](API_TYPES.md#yearlysummaryitem) | - |
| `get_monthly_financial_summary_command` | Get monthly financial summary for yearly reports. | [`Vec<MonthlyFinancialSummaryItem>`](API_TYPES.md#monthlyfinancialsummaryitem) | - |
| `get_financial_summary_stats_command` | Get aggregated financial statistics. | [`FinancialSummaryStats`](API_TYPES.md#financialsummarystats) | - |
| `get_monthly_category_amounts_command` | Get monthly total amounts for a specific category. | [`Vec<CategoryMonthlyAmount>`](API_TYPES.md#categorymonthlyamount) | `useStatisticsStore` |
| `compare_dashboard` | Compare dashboard metrics between two periods. | `ComparisonMetric` | `useDashboardStore` |
| `get_recent_7days_expenses` | Get expense totals for the last 7 days. | [`Vec<DailyExpense>`](API_TYPES.md#dailyexpense) | `useDashboardStore` |
| `get_recent_transactions` | Get the most recent transactions. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useDashboardStore` |
| `get_top_fixed_expenses` | Get top fixed expenses for a month. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useDashboardStore` |
| `get_top_variable_expenses` | Get top variable expenses for a month. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useDashboardStore` |
| `get_top_incomes` | Get top income sources for a month. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useDashboardStore` |
| `get_yearly_dashboard_data_command` | Get combined data for the yearly dashboard. | [`YearlyDashboardData`](API_TYPES.md#yearlydashboarddata) | `useStatisticsStore` |
| `get_expense_treemap` | Get hierarchical data for expense treemap. | [`TreemapNode`](API_TYPES.md#treemapnode) | `useDashboardStore` |
| `get_daily_chart_detail` | Get detailed transaction list for a specific day and filter. | [`DailyDetailResponse`](API_TYPES.md#dailydetailresponse) | `useDashboardStore` |
| `get_monthly_fixed_variable_transactions` | Get breakdown of fixed vs variable expenses. | [`Vec<CategoryFixedVariableSummary>`](API_TYPES.md#categoryfixedvariablesummary) | `useDashboardStore` |
| `get_badge_statistics_command` | Get statistics for dashboard badges. | [`BadgeStats`](API_TYPES.md#badgestats) | `useStatisticsStore` |
| `get_day_of_week_stats_command` | Get transaction statistics by day of the week (All time). | [`DayOfWeekResponse`](API_TYPES.md#dayofweekresponse) | - |
| `get_day_of_week_stats_monthly_command` | Get transaction statistics by day of the week (Monthly). | [`DayOfWeekResponse`](API_TYPES.md#dayofweekresponse) | `useDashboardStore` |
| **Database** | | | |
| `get_db_path` | Get the absolute path of the database file. | `String` | `DbSettings.tsx` |
| `backup_db` | Create a manual backup of the database. | `String` | `DbSettings.tsx` |
| `list_backups` | List all available backup files. | `Vec<String>` | `DbSettings.tsx` |
| `restore_backup` | Restore the database from a backup file. | `()` | `DbSettings.tsx` |
| `open_db_folder` | Open the folder containing the database file. | `()` | `DbSettings.tsx` |
| `open_backup_folder` | Open the folder containing backup files. | `()` | `DbSettings.tsx` |
| `delete_backup` | Delete a specific backup file. | `()` | `DbSettings.tsx` |
| `export_transactions_csv` | Export all transactions to a CSV file. | `String` | `DbSettings.tsx` |
| `get_export_path` | Get the path where exports are saved. | `String` | `DbSettings.tsx` |
| `open_export_folder` | Open the export folder. | `()` | `DbSettings.tsx` |
| `import_transactions_csv` | Import transactions from a CSV file. | `u32` | `DbSettings.tsx`, `CsvImportCard.tsx` |
| **Recurring** | | | |
| `get_recurring_transactions` | Get all recurring transactions. | [`Vec<RecurringTransaction>`](API_TYPES.md#recurringtransaction) | `RecurringSettings.tsx` |
| `get_recurring_history` | Get execution history of recurring transactions. | [`Vec<RecurringHistoryItem>`](API_TYPES.md#recurringhistoryitem) | `RecurringSettings.tsx` |
| `create_recurring_transaction` | Create a new recurring transaction. | `i64` | `RecurringSettings.tsx` |
| `update_recurring_transaction` | Update an existing recurring transaction. | `()` | `RecurringSettings.tsx` |
| `delete_recurring_transaction` | Delete a recurring transaction. | `()` | `RecurringSettings.tsx` |
| `toggle_recurring_transaction` | Toggle the active status of a recurring transaction. | `()` | `RecurringSettings.tsx` |
| `process_recurring_transactions` | Process all pending recurring transactions (Batch). | `i32` | - |
| `process_single_recurring_transaction` | Process a specific recurring transaction immediately. | `i32` | `RecurringSettings.tsx` |
| **Settings** | | | |
| `get_setting_command` | Get a specific setting value by key. | `Option<String>` | `useAppStore`, `useSyncStore`, `GeneralSettings`, `DbSettings` |
| `set_setting_command` | Set a specific setting value. | `()` | `useAppStore`, `useSyncStore`, `GeneralSettings`, `DbSettings` |
| **Transaction** | | | |
| `create_transaction` | Create a new transaction. | [`i64`](API_TYPES.md#transaction) | `useTransactionStore` |
| `get_transactions` | Get all transactions. | [`Vec<Transaction>`](API_TYPES.md#transaction) | - |
| `get_transactions_with_category` | Get all transactions with category details. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | - |
| `update_transaction` | Update an existing transaction. | `()` | `useTransactionStore` |
| `delete_transaction` | Delete a transaction. | `()` | `useTransactionStore` |
| `delete_bulk_transactions` | Delete multiple transactions by ID. | `String` | `useTransactionStore` |
| `get_transactions_by_date` | Get transactions for a specific date. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useTransactionStore` |
| `get_all_daily_summaries` | Get daily summaries for all time. | [`Vec<DailySummary>`](API_TYPES.md#dailysummary) | `useTransactionStore` |
| `get_all_monthly_total_trends` | Get monthly trends for all time. | [`Vec<MonthlyTotalSummary>`](API_TYPES.md#monthlytotalsummary) | `useTransactionStore` |
| `get_transactions_by_month_and_category` | Get transactions filtered by month and category. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | - |
| `get_filtered_transactions_command` | Get transactions based on multiple filters. | [`Vec<TransactionWithCategory>`](API_TYPES.md#transactionwithcategory) | `useTransactionStore` |
| `parse_transaction_file` | Parse an Excel/CSV file for preview. | [`Vec<ExcelPreviewRow>`](API_TYPES.md#excelpreviewrow) | `useQuickEntry` |
| `generate_excel_template` | Generate an Excel template for bulk import. | `()` | `useQuickEntry` |
| `bulk_create_transactions` | Create multiple transactions at once. | `String` | `useQuickEntry` |
| **OneDrive** | | | |
| `onedrive_login` | Initiate OneDrive login flow. | `String` | `useSyncStore` |
| `onedrive_logout` | Log out from OneDrive and clear tokens. | `()` | `useSyncStore` |
| `onedrive_backup` | Upload database backup to OneDrive. | `String` | `useSyncStore` |
| `onedrive_restore` | Restore database from OneDrive. | `String` | `useSyncStore` |
| `onedrive_check_status` | Check current OneDrive connection status. | `OneDriveStatus` | `useSyncStore` |
| `check_onedrive_sync_status` | Check if a sync with OneDrive is needed. | [`SyncCheckResult`](API_TYPES.md#synccheckresult) | `useSyncStore` |
| `onedrive_auto_sync` | Automatically sync the database from OneDrive if needed. | `String` | `useSyncStore` |
