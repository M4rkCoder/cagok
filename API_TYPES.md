# Tauri Backend API Data Types

This document defines the data structures and enums used in the Finkro Tauri Backend API.

## Core Entities

### Transaction
Represents a single income or expense record.
```rust
struct Transaction {
    id: Option<i64>,
    description: Option<String>,
    amount: f64,
    date: String,       // Format: "YYYY-MM-DD"
    type: i64,          // 0: Income, 1: Expense
    is_fixed: i64,      // 0: Variable, 1: Fixed
    remarks: Option<String>,
    category_id: Option<i64>,
}
```

### TransactionWithCategory
A transaction with joined category information.
```rust
struct TransactionWithCategory {
    // ... all fields from Transaction
    category_name: Option<String>,
    category_icon: Option<String>,
}
```

### Category
```rust
struct Category {
    id: Option<i64>,
    name: String,
    icon: String,
    type: i64, // 0: Income, 1: Expense
}
```

### RecurringTransaction
Represents a scheduled transaction template.
```rust
struct RecurringTransaction {
    id: Option<i32>,
    description: String,
    amount: f64,
    category_id: Option<i32>,
    frequency: RecurringFrequency, // Enum (int)
    start_date: String,            // "YYYY-MM-DD"
    end_date: Option<String>,
    day_of_month: Option<i32>,     // 1-31 (for Monthly)
    day_of_week: Option<i32>,      // 0-6 (0=Sunday) (for Weekly)
    is_active: bool,
    last_created_date: Option<String>,
    remarks: Option<String>,
}
```

### RecurringFrequency (Enum)
```rust
enum RecurringFrequency {
    Daily = 0,
    Weekly = 1,
    Monthly = 2,
    Yearly = 3,
}
```

---

## Dashboard & Statistics

### MonthlyOverview
High-level summary for a specific month.
```rust
struct MonthlyOverview {
    total_income: f64,
    total_expense: f64,
    net_income: f64,
    fixed_expense: f64,
    fixed_expense_ratio: f64, // Percentage (0.0 - 100.0)
    daily_average: f64,
}
```

### DailySummary
Aggregated totals for a single day.
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

### MonthlyTotalSummary
Aggregated totals for a month.
```rust
struct MonthlyTotalSummary {
    year_month: String, // "YYYY-MM"
    income_total: f64,
    expense_total: f64,
    income_count: i64,
    expense_count: i64,
    total_count: i64,
}
```

### CategoryExpense
Expense summary by category for a period.
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

### DailyExpense
Total expense amount for a specific date (simplified view).
```rust
struct DailyExpense {
    date: String,
    total_amount: f64,
    transaction_count: i32,
}
```

### DailyCategoryTransaction
Breakdown of transactions by category for a specific day.
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

### DailyDetailResponse
Detailed transactions list for a specific view (e.g., clicking a chart).
```rust
struct DailyDetailResponse {
    items: Vec<TransactionWithCategory>,
    total_amount: f64,
}
```

### YearlySummaryItem
Summary for a specific year.
```rust
struct YearlySummaryItem {
    year: i32,
    total_income: f64,
    total_expense: f64,
    net_income: f64,
}
```

### MonthlyFinancialSummaryItem
Detailed monthly summary used in yearly analysis.
```rust
#[serde(rename_all = "camelCase")]
struct MonthlyFinancialSummaryItem {
    year_month: String,
    total_income: f64,
    total_expense: f64,
    net_income: f64,
    fixed_expense: f64,
    variable_expense: f64,
}
```

### MetricStats
Statistical metrics (min, max, avg) for a dataset.
```rust
struct MetricStats {
    total: f64,
    average: f64,
    max: f64,
    min: f64,
}
```

### FinancialSummaryStats
Container for statistics across different financial metrics.
```rust
#[serde(rename_all = "camelCase")]
struct FinancialSummaryStats {
    income: MetricStats,
    expense: MetricStats,
    net_income: MetricStats,
    fixed_expense: MetricStats,
}
```

### YearlyDashboardData
Aggregated data for the yearly dashboard.
```rust
#[serde(rename_all = "camelCase")]
struct YearlyDashboardData {
    financial_summary_stats: FinancialSummaryStats,
    monthly_financial_summary: Vec<MonthlyFinancialSummaryItem>,
}
```

### CategoryMonthlyAmount
Monthly total amount for a specific category (Trend analysis).
```rust
struct CategoryMonthlyAmount {
    year_month: String,
    category_id: i64,
    category_name: String,
    category_icon: String,
    total_amount: f64,
    type: i64,
}
```

### ComparisonMetric
Result of comparing two periods.
```rust
struct ComparisonMetric {
    current: i64,
    previous: i64,
    diff: i64,
    diff_rate: f64, // Percentage
}
```

### ComparisonType (Enum)
```rust
enum ComparisonType {
    Expense,
    Income,
    NetIncome,
    Fixed,
    FixedRatio,
}
```

### TreemapNode
Hierarchical data for Treemap charts.
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

### CategoryFixedVariableSummary
Breakdown of Fixed vs Variable expenses per category.
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

---

## Filters & Payloads

### TransactionFilters
Filters used for searching transactions.
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

### RecurringPayload
Event payload sent when recurring transactions are processed.
```rust
struct RecurringPayload {
    count: i32,
    timestamp: String,
}
```
