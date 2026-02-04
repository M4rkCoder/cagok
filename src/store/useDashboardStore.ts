import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { getPeriodComparison } from "@/lib/api/dashbaord";
import {
  MonthlyOverview,
  CategoryExpense,
  DailyExpense,
  MonthlyExpense,
  ComparisonType,
  ComparisonMetric,
  TransactionWithCategory,
  FinancialSummaryStats,
  MonthlyFinancialSummaryItem,
  CategoryMonthlyAmount,
  MetricStats
} from "@/types";

// Default empty MetricStats for safe access (re-defined here for store-specific use if needed)
const emptyMetricStats: MetricStats = {
  total: 0,
  average: 0,
  max: 0,
  min: 0,
};

// Default empty FinancialSummaryStats for safe access when fetched data is null
const defaultFinancialSummaryStats: FinancialSummaryStats = {
  income: emptyMetricStats,
  expense: emptyMetricStats,
  netIncome: emptyMetricStats,
  fixedExpense: emptyMetricStats,
};

interface DashboardState {
  overview: MonthlyOverview | null;
  categories: CategoryExpense[];
  categoriesIncome: CategoryExpense[];
  dailyExpenses: DailyExpense[];
  daily7Expenses: DailyExpense[];
  recentTransactions: TransactionWithCategory[];
  topIncomes: TransactionWithCategory[];
  topFixedExpenses: TransactionWithCategory[];
  monthlyExpenses: MonthlyExpense[];
  monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
  financialSummaryStats: FinancialSummaryStats | null;
  categoryMonthlyAmounts: CategoryMonthlyAmount[];
  comparisons: Record<ComparisonType, ComparisonMetric | null>;
  loading: boolean;
  loadDashboardData: (selectedMonth: string) => Promise<void>;
  loadYearlyDashboardData: (year: number) => Promise<void>;
  loadCategoryMonthlyAmounts: (
    year: number,
    categoryId?: number | null,
  ) => Promise<void>;
}

const getMonthRange = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;

  const prevMonth = new Date(year, month - 2, 1);
  const prevYearMonth = `${prevMonth.getFullYear()}-${String(
    prevMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  return {
    current: { start, end },
    previous: {
      start: `${prevYearMonth}-01`,
      end: `${prevYearMonth}-31`,
    },
  };
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overview: null,
  categories: [],
  categoriesIncome: [],
  dailyExpenses: [],
  daily7Expenses: [],
  recentTransactions: [],
  topIncomes: [],
  topFixedExpenses: [],
  monthlyExpenses: [],
  monthlyFinancialSummary: [],
  financialSummaryStats: null,
  categoryMonthlyAmounts: [],
  comparisons: {
    Expense: null,
    Income: null,
    NetIncome: null,
    Fixed: null,
    FixedRatio: null,
  },
  loading: true,
  loadDashboardData: async (selectedMonth: string) => {
    try {
      set({ loading: true });

      const { current, previous } = getMonthRange(selectedMonth);

      const types: ComparisonType[] = [
        "Income",
        "Expense",
        "NetIncome",
        "Fixed",
        "FixedRatio",
      ];

      const [
        overviewData,
        categoriesData,
        categoriesIncome,
        dailyData,
        daily7Data,
        recentData,
        topIncomesData,
        topFixedData,
        monthlyData,
        comparisonData,
      ] = await Promise.all([
        invoke<MonthlyOverview>("get_monthly_overview", {
          yearMonth: selectedMonth,
        }),
        invoke<CategoryExpense[]>("get_category_transactions", {
          yearMonth: selectedMonth,
          txType: 1,
        }),
        invoke<CategoryExpense[]>("get_category_transactions", {
          yearMonth: selectedMonth,
          txType: 0, //income
        }),
        invoke<DailyExpense[]>("get_daily_expenses", {
          yearMonth: selectedMonth,
        }),
        invoke<DailyExpense[]>("get_recent_7days_expenses", {
          yearMonth: selectedMonth,
        }),
        invoke<TransactionWithCategory[]>("get_recent_transactions", {
          yearMonth: selectedMonth,
          limit: 5,
        }),
        // 새로 만든 Command 호출 (Top 5개)
        invoke<TransactionWithCategory[]>("get_top_incomes", {
          yearMonth: selectedMonth,
          limit: 5,
        }),
        // 새로 만든 Command 호출 (Top 5개)
        invoke<TransactionWithCategory[]>("get_top_fixed_expenses", {
          yearMonth: selectedMonth,
          limit: 5,
        }),
        invoke<MonthlyExpense[]>("get_monthly_transactions", {
          months: 6,
          txType: 1,
        }),
        Promise.all(
          types.map((type) =>
            getPeriodComparison({
              comparisonType: type,
              currentStart: current.start,
              currentEnd: current.end,
              previousStart: previous.start,
              previousEnd: previous.end,
            }).then((data) => ({ type, data }))
          )
        ),
      ]);

      const comparisonMap = comparisonData.reduce(
        (acc, { type, data }) => {
          acc[type] = data;
          return acc;
        },
        {} as Record<ComparisonType, ComparisonMetric>
      );

      set({
        overview: overviewData,
        categories: categoriesData,
        categoriesIncome: categoriesIncome,
        dailyExpenses: dailyData,
        daily7Expenses: daily7Data,
        monthlyExpenses: monthlyData,
        recentTransactions: recentData,
        topIncomes: topIncomesData,
        topFixedExpenses: topFixedData,
        comparisons: comparisonMap,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadYearlyDashboardData: async (year: number) => {
    try {
      set({ loading: true });
      const yearlyData = await invoke<{
        financialSummaryStats: FinancialSummaryStats;
        monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
      } | null>("get_yearly_dashboard_data_command", { year });


      set({
        financialSummaryStats: yearlyData?.financialSummaryStats ?? defaultFinancialSummaryStats,
        monthlyFinancialSummary: yearlyData?.monthlyFinancialSummary ?? [],
      });

      // Initially load all monthly category amounts for the selected year
      get().loadCategoryMonthlyAmounts(year, null);
    } catch (error) {
      console.error("Failed to load yearly dashboard data:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadCategoryMonthlyAmounts: async (
    year: number,
    categoryId?: number | null,
  ) => {
    try {
      set({ loading: true });
      const amounts = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        { year, categoryId },
      );
      set({ categoryMonthlyAmounts: amounts ?? [] });
    } catch (error) {
      console.error("Failed to load monthly category amounts:", error);
    } finally {
      set({ loading: false });
    }
  },
}));