import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { getPeriodComparison } from "@/lib/api/dashbaord";
import {
  MonthlyOverview,
  CategoryExpense,
  DailyExpense,
  TransactionWithCategory,
  DailyCategoryTransaction,
  TreemapNode,
  DailyDetailResponse,
  CategoryFixedVariableSummary,
  DayOfWeekResponse,
  ComparisonType,
  ComparisonMetric,
} from "@/types";
import { format } from "date-fns";

interface DashboardState {
  selectedMonth: string;
  overview: MonthlyOverview | null;
  categoriesExpense: CategoryExpense[];
  categoriesIncome: CategoryExpense[];
  dailyExpenses: DailyExpense[];
  dailyCategoryExpenses: DailyCategoryTransaction[];
  dailyCategoryIncomes: DailyCategoryTransaction[];
  recentTransactions: TransactionWithCategory[];
  topIncomes: TransactionWithCategory[];
  topFixedExpenses: TransactionWithCategory[];
  topVariableExpenses: TransactionWithCategory[];
  comparisons: Record<ComparisonType, ComparisonMetric | null>;
  loading: boolean;
  expenseTreemap: TreemapNode | null;
  activeTreemapNode: string | null;
  detailData: DailyDetailResponse | null;
  detailLoading: boolean;
  dialogState: {
    isOpen: boolean;
    date: string | null;
    categoryId: number | null;
    txType: number;
  };
  fixedVariableTransactions: CategoryFixedVariableSummary[];
  treemapDialogOpen: boolean;
  dayOfWeekExpense: DayOfWeekResponse | null;
  dayOfWeekIncome: DayOfWeekResponse | null;
  setTreemapDialogOpen: (open: boolean) => void;
  loadChartDetail: (
    date: string,
    txType: number,
    categoryId?: number | null
  ) => Promise<void>;
  setDetailData: (data: DailyDetailResponse | null) => void;
  openDialog: (
    date: string,
    txType: number,
    categoryId?: number | null
  ) => void;
  closeDialog: () => void;
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
  dailyCategoryExpenses: [],
  dailyCategoryIncomes: [],
  recentTransactions: [],
  topIncomes: [],
  topFixedExpenses: [],
  topVariableExpenses: [],
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
  detailData: null,
  detailLoading: false,
  dialogState: { isOpen: false, date: null, categoryId: null, txType: 1 },
  fixedVariableTransactions: [],
  treemapDialogOpen: false,
  dayOfWeekExpense: null,
  dayOfWeekIncome: null,

  setTreemapDialogOpen: (open: boolean) => set({ treemapDialogOpen: open }),
  openDialog: (date, txType, categoryId = null) =>
    set({ dialogState: { isOpen: true, date, txType, categoryId } }),
  closeDialog: () =>
    set((state) => ({
      dialogState: { ...state.dialogState, isOpen: false },
      detailData: { items: [], total_amount: 0, categoryId: null },
    })),
  setDetailData: (data) => set({ detailData: data }),
  setActiveTreemapNode: (node) => set({ activeTreemapNode: node }),
  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    get().loadDashboardData();
  },

  loadChartDetail: async (date, txType, categoryId = null) => {
    try {
      set({ detailLoading: true });
      const response = await invoke<DailyDetailResponse>(
        "get_daily_chart_detail",
        { date, txType, categoryId }
      );
      set({ detailData: response });
    } catch (error) {
      console.error("Failed to load chart detail:", error);
      set({ detailData: null });
    } finally {
      set({ detailLoading: false });
    }
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
        dailyCategoryExpense,
        dailyCategoryIncome,
        recentData,
        topIncomesData,
        topFixedData,
        topVariableData,
        comparisonResults,
        treemapData,
        fixedVariableData,
        dayOfWeekExpData, // 요일별 지출 추가
        dayOfWeekIncData, // 요일별 수입 추가
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
          txType: 0,
        }),
        invoke<DailyExpense[]>("get_daily_expenses", {
          yearMonth: selectedMonth,
        }),
        invoke<DailyCategoryTransaction[]>("get_daily_category_transactions", {
          yearMonth: selectedMonth,
          txType: 1,
        }),
        invoke<DailyCategoryTransaction[]>("get_daily_category_transactions", {
          yearMonth: selectedMonth,
          txType: 0,
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
        invoke<CategoryFixedVariableSummary[]>(
          "get_monthly_fixed_variable_transactions",
          { yearMonth: selectedMonth }
        ),
        invoke<DayOfWeekResponse>("get_day_of_week_stats_monthly_command", {
          baseMonth: selectedMonth,
          txType: 1,
        }),
        invoke<DayOfWeekResponse>("get_day_of_week_stats_monthly_command", {
          baseMonth: selectedMonth,
          txType: 0,
        }),
      ]);

      const comparisonMap = comparisonResults.reduce(
        (acc, { type, data }) => {
          acc[type] = data;
          return acc;
        },
        {} as Record<ComparisonType, ComparisonMetric>
      );

      set({
        overview: overviewData,
        categoriesExpense,
        categoriesIncome,
        dailyExpenses: dailyData,
        dailyCategoryExpenses: dailyCategoryExpense,
        dailyCategoryIncomes: dailyCategoryIncome,
        recentTransactions: recentData,
        topIncomes: topIncomesData,
        topFixedExpenses: topFixedData,
        topVariableExpenses: topVariableData,
        expenseTreemap: treemapData,
        comparisons: comparisonMap,
        fixedVariableTransactions: fixedVariableData,
        dayOfWeekExpense: dayOfWeekExpData,
        dayOfWeekIncome: dayOfWeekIncData,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
