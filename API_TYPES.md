# API Types

This document defines the data structures used in the API.

## Core Models

### `Category`
Represents a transaction category.
```rust
struct Category {
    id: Option<i64>,
    name: String,
    icon: String,
    type: i64, // 0: Income, 1: Expense
}
```

### `Transaction`
Represents a single financial transaction.
```rust
struct Transaction {
    id: Option<i64>,
    description: Option<String>,
    amount: f64,
    date: String, // YYYY-MM-DD
    type: i64, // 0: Income, 1: Expense
    is_fixed: i64, // 0: Variable, 1: Fixed
    remarks: Option<String>,
    category_id: Option<i64>,
}
```

### `TransactionWithCategory`
A transaction including its associated category details.
```rust
struct TransactionWithCategory {
    id: Option<i64>,
    description: Option<String>,
    amount: f64,
    date: String,
    type: i64,
    is_fixed: i64,
    remarks: Option<String>,
    category_id: Option<i64>,
    category_name: Option<String>,
    category_icon: Option<String>,
}
```

### `RecurringTransaction`
Represents a recurring transaction setup.
```rust
struct RecurringTransaction {
    id: Option<i32>,
    description: String,
    amount: f64,
    category_id: Option<i32>,
    frequency: RecurringFrequency,
    start_date: String, // YYYY-MM-DD
    end_date: Option<String>,
    day_of_month: Option<i32>,
    day_of_week: Option<i32>,
    is_active: bool,
    last_created_date: Option<String>,
    remarks: Option<String>,
}
```

### `RecurringHistoryItem`
Represents a history record of a processed recurring transaction.
```rust
struct RecurringHistoryItem {
    id: i64,
    recurring_id: i64,
    transaction_id: i64,
    created_at: String,
    amount: f64,
    description: String,
    category_name: Option<String>,
    category_icon: Option<String>,
    category_type: Option<i64>,
}
```

### `OneDriveStatus`
Represents the connection status with OneDrive.
```rust
struct OneDriveStatus {
    is_connected: bool,
    last_synced: Option<String>,
    account_name: Option<String>,
    account_email: Option<String>,
}
```

## Enums

### `RecurringFrequency`
Enum for recurring transaction frequency.
- `Daily` (0)
- `Weekly` (1)
- `Monthly` (2)
- `Yearly` (3)

### `ComparisonType`
Enum for dashboard comparison metrics.
- `Expense`
- `Income`
- `NetIncome`
- `Fixed`
- `FixedRatio`

## Dashboard & Statistics Models

### `DailySummary`
Summary of transactions for a specific day.
```rust
struct DailySummary {
    date: String,
    income_total: f64,
    expense_total: f64,
    income_count: i64,
    expense_count: i64,
    total_count: i64,
}
```

### `MonthlyTotalSummary`
Summary of transactions for a specific month.
```rust
struct MonthlyTotalSummary {
    year_month: String,
    income_total: f64,
    expense_total: f64,
    income_count: i64,
    expense_count: i64,
    total_count: i64,
}
```

### `MonthlyOverview`
Overview data for a specific month dashboard.
```rust
struct MonthlyOverview {
    total_income: f64,
    total_expense: f64,
    net_income: f64,
    fixed_expense: f64,
    fixed_expense_ratio: f64,
    daily_average: f64,
}
```

### `CategoryExpense`
Expense summary for a specific category.
```rust
struct CategoryExpense {
    category_id: i32,
    category_name: String,
    category_icon: String,
    total_amount: f64,
    percentage: f64,
    transaction_count: i32,
}
```

### `DailyExpense`
Daily expense total.
```rust
struct DailyExpense {
    date: String,
    total_amount: f64,
    transaction_count: i32,
}
```

### `DailyCategoryTransaction`
Aggregated transaction data by day and category.
```rust
struct DailyCategoryTransaction {
    date: String,
    category_id: i32,
    category_name: String,
    category_icon: String,
    total_amount: f64,
    tx_type: i32,
    transaction_count: i32,
}
```

### `YearlySummaryItem`
Summary data for a year.
```rust
struct YearlySummaryItem {
    year: i32,
    total_income: f64,
    total_expense: f64,
    net_income: f64,
}
```

### `MonthlyFinancialSummaryItem`
Financial summary for a specific month used in yearly reports.
```rust
struct MonthlyFinancialSummaryItem {
    year_month: String,
    total_income: f64,
    total_expense: f64,
    net_income: f64,
    fixed_expense: f64,
    variable_expense: f64,
}
```

### `MetricStats`
Statistics for a specific financial metric (e.g., income, expense).
```rust
struct MetricStats {
    total: f64,
    average: f64,
    max: f64,
    min: f64,
    max_month: Option<String>,
    min_month: Option<String>,
}
```

### `FinancialSummaryStats`
Aggregated financial statistics.
```rust
struct FinancialSummaryStats {
    income: MetricStats,
    expense: MetricStats,
    net_income: MetricStats,
    fixed_expense: MetricStats,
}
```

### `CategoryMonthlyAmount`
Monthly total amount for a category.
```rust
struct CategoryMonthlyAmount {
    year_month: String,
    category_id: i64,
    category_name: String,
    category_icon: String,
    total_amount: f64,
    transaction_count: i64,
    type: i64,
}
```

### `YearlyDashboardData`
Combined data for the yearly dashboard.
```rust
struct YearlyDashboardData {
    financial_summary_stats: FinancialSummaryStats,
    monthly_financial_summary: Vec<MonthlyFinancialSummaryItem>,
}
```

### `TreemapNode`
Node structure for treemap visualizations.
```rust
struct TreemapNode {
    name: String,
    value: f64,
    percentage: f64,
    category_id: Option<i64>,
    category_icon: Option<String>,
    item_type: String, // "root", "group", "category"
    children: Option<Vec<TreemapNode>>,
}
```

### `CategoryFixedVariableSummary`
Summary of fixed vs variable expenses for a category.
```rust
struct CategoryFixedVariableSummary {
    category_id: i64,
    category_name: String,
    category_icon: String,
    fixed_total: f64,
    variable_total: f64,
    fixed_items: Vec<TransactionWithCategory>,
    variable_items: Vec<TransactionWithCategory>,
}
```

### `ComparisonMetric`
Comparison result between two periods.
```rust
struct ComparisonMetric {
    current: i64,
    previous: i64,
    diff: i64,
    diff_rate: f64,
}
```

### `BadgeStats`
Statistics for dashboard badges.
```rust
struct BadgeStats {
    max_expense_month: Option<MonthAmountStat>,
    max_income_month: Option<MonthAmountStat>,
    net_income_ratio: f64,
    max_expense_category: Option<CategoryStat>,
    most_frequent_category: Option<CategoryStat>,
    max_expense_day_of_week: Option<DayOfWeekStat>,
}
```

### `DayOfWeekResponse`
Response structure for day of week statistics.
```rust
struct DayOfWeekResponse {
    categories: Vec<DayOfWeekCategoryStat>,
    totals: Vec<DayOfWeekTotalStat>,
}
```

### `DayOfWeekCategoryStat`
Statistics for a category by day of week.
```rust
struct DayOfWeekCategoryStat {
    day_of_week: i32, // 0: Sun ... 6: Sat
    category_id: i64,
    category_name: String,
    category_icon: String,
    total_amount: f64,
    transaction_count: i64,
    day_count: i64,
    average_amount: f64,
}
```

### `DayOfWeekTotalStat`
Total statistics by day of week.
```rust
struct DayOfWeekTotalStat {
    day_of_week: i32,
    total_amount: f64,
    transaction_count: i64,
    day_count: i64,
    average_amount: f64,
}
```

## Helper Models

### `TransactionFilters`
Filter criteria for querying transactions.
```rust
struct TransactionFilters {
    keyword: Option<String>,
    tx_type: Option<i32>,
    is_fixed: Option<bool>,
    category_ids: Option<Vec<i32>>,
    start_date: Option<String>,
    end_date: Option<String>,
    min_amount: Option<f64>,
    max_amount: Option<f64>,
}
```

### `RecurringPayload`
Payload for recurring transaction events.
```rust
struct RecurringPayload {
    count: i32,
    timestamp: String,
}
```

### `DailyDetailResponse`
Response for detailed daily transaction view.
```rust
struct DailyDetailResponse {
    items: Vec<TransactionWithCategory>,
    total_amount: f64,
}
```

### `ExcelPreviewRow`
Preview data for Excel import.
```rust
struct ExcelPreviewRow {
    id: String,
    date: String,
    tx_type: i32,
    category_id: String,
    category_name: String,
    is_fixed: i32,
    description: String,
    amount: String,
    remarks: String,
    is_valid: bool,
    error_msg: Option<String>,
}
```

### `MonthAmountStat`
Helper for BadgeStats.
```rust
struct MonthAmountStat {
    month: String,
    amount: f64,
}
```

### `CategoryStat`
Helper for BadgeStats.
```rust
struct CategoryStat {
    name: String,
    icon: String,
    value: f64,
}
```

### `DayOfWeekStat`
Helper for BadgeStats.
```rust
struct DayOfWeekStat {
    day: String,
    amount: f64,
}
```
