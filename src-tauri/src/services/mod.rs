pub mod dashboard;
pub mod recurring;
//pub use dashboard::DashboardService;
pub use recurring::RecurringService;

#[derive(Debug, serde::Serialize)]
pub struct ComparisonMetric {
    pub current: i64,
    pub previous: i64,
    pub diff: i64,
    pub diff_rate: f64, // %
}

impl ComparisonMetric {
    pub fn new(current: i64, previous: i64) -> Self {
        let diff = current - previous;

        let diff_rate = if previous == 0 {
            if current == 0 {
                0.0
            } else {
                100.0
            }
        } else {
            (diff as f64 / previous as f64) * 100.0
        };

        Self {
            current,
            previous,
            diff,
            diff_rate,
        }
    }
}

#[derive(serde::Deserialize)]
pub enum ComparisonType {
    Expense,
    Income,
    NetIncome,
    FixedRatio,
}
