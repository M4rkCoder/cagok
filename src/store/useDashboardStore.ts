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
  DailyCategoryTransaction,
  TreemapNode,
} from "@/types";
import { format } from "date-fns";

interface DashboardState {
  selectedMonth: string;
  overview: MonthlyOverview | null;
  categoriesExpense: CategoryExpense[];
  categoriesIncome: CategoryExpense[];
  dailyExpenses: DailyExpense[];
  daily7Expenses: DailyExpense[];
  dailyCategoryExpenses: DailyCategoryTransaction[];
  dailyCategoryIncomes: DailyCategoryTransaction[];
  recentTransactions: TransactionWithCategory[];
  topIncomes: TransactionWithCategory[];
  topFixedExpenses: TransactionWithCategory[];
  topVariableExpenses: TransactionWithCategory[];
  monthlyExpenses: MonthlyExpense[];
  comparisons: Record<ComparisonType, ComparisonMetric | null>;
  loading: boolean;
  expenseTreemap: TreemapNode | null;
  activeTreemapNode: string | null;
  setSelectedMonth: (month: string) => void;
  loadDashboardData: () => Promise<void>;
  setActiveTreemapNode: (node: string | null) => void;
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
  selectedMonth: format(new Date(), "yyyy-MM"),
  overview: null,
  categoriesExpense: [],
  categoriesIncome: [],
  dailyExpenses: [],
  daily7Expenses: [],
  dailyCategoryExpenses: [],
  dailyCategoryIncomes: [],
  recentTransactions: [],
  topIncomes: [],
  topFixedExpenses: [],
  topVariableExpenses: [],
  monthlyExpenses: [],
  comparisons: {
    Expense: null,
    Income: null,
    NetIncome: null,
    Fixed: null,
    FixedRatio: null,
  },
  loading: true,
  expenseTreemap: null,
  activeTreemapNode: null,
  setActiveTreemapNode: (node) => set({ activeTreemapNode: node }),
  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    get().loadDashboardData();
  },

  loadDashboardData: async () => {
    const { selectedMonth } = get();
    if (!selectedMonth) return;
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
        categoriesExpense,
        categoriesIncome,
        dailyData,
        daily7Data,
        dailyCategoryExpense,
        dailyCategoryIncome,
        recentData,
        topIncomesData,
        topFixedData,
        topVariableData,
        monthlyData,
        comparisonData,
        treemapData,
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
        invoke<DailyCategoryTransaction[]>("get_daily_category_transactions", {
          yearMonth: selectedMonth,
          txType: 1, // 지출 기준
        }),
        invoke<DailyCategoryTransaction[]>("get_daily_category_transactions", {
          yearMonth: selectedMonth,
          txType: 0, // 수입 기준
        }),
        invoke<TransactionWithCategory[]>("get_recent_transactions", {
          yearMonth: selectedMonth,
          limit: 5,
        }),
        invoke<TransactionWithCategory[]>("get_top_incomes", {
          yearMonth: selectedMonth,
          limit: 5,
        }),
        invoke<TransactionWithCategory[]>("get_top_fixed_expenses", {
          yearMonth: selectedMonth,
          limit: 20,
        }),
        invoke<TransactionWithCategory[]>("get_top_variable_expenses", {
          yearMonth: selectedMonth,
          limit: 20,
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
        invoke<TreemapNode>("get_expense_treemap", {
          yearMonth: selectedMonth,
        }),
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
        categoriesExpense: categoriesExpense,
        categoriesIncome: categoriesIncome,
        dailyExpenses: dailyData,
        daily7Expenses: daily7Data,
        dailyCategoryExpenses: dailyCategoryExpense,
        dailyCategoryIncomes: dailyCategoryIncome,
        monthlyExpenses: monthlyData,
        recentTransactions: recentData,
        topIncomes: topIncomesData,
        topFixedExpenses: topFixedData,
        topVariableExpenses: topVariableData,
        expenseTreemap: treemapData,
        comparisons: comparisonMap,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
