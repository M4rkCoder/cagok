import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  FinancialSummaryStats,
  MonthlyFinancialSummaryItem,
  CategoryMonthlyAmount,
  MetricStats,
  BadgeStats,
} from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

// 기본값 정의
const emptyMetricStats: MetricStats = {
  total: 0,
  average: 0,
  max: 0,
  min: 0,
};

const defaultFinancialSummaryStats: FinancialSummaryStats = {
  income: emptyMetricStats,
  expense: emptyMetricStats,
  netIncome: emptyMetricStats,
  fixedExpense: emptyMetricStats,
};

interface StatisticsState {
  // 상태
  viewMode: "year" | "month";
  selectedYear: number;
  selectedMonth: string;
  baseMonth: string;

  monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
  financialSummaryStats: FinancialSummaryStats | null;
  categoryMonthlyAmounts: CategoryMonthlyAmount[];
  badgeStats: BadgeStats | null;
  loading: boolean;

  // 액션
  setViewMode: (viewMode: "year" | "month") => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: string) => void;

  // 추가된 계산 기능: 현재 설정된 기간을 문자열로 반환
  getFormattedPeriod: () => string;

  loadYearlyStatistics: () => Promise<void>;
  loadCategoryTrend: () => Promise<void>;
  loadBadgeStatistics: () => Promise<void>;
  loadAllStatistics: () => Promise<void>;
  resetStatistics: () => void;
}

const calculateBaseMonth = (
  viewMode: "year" | "month",
  selectedYear: number,
  selectedMonth: string
) => {
  return viewMode === "year" ? `${selectedYear}-12` : selectedMonth;
};

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  viewMode: "month",
  selectedYear: new Date().getFullYear(),
  selectedMonth: format(new Date(), "yyyy-MM"),
  baseMonth: format(new Date(), "yyyy-MM"),

  monthlyFinancialSummary: [],
  financialSummaryStats: null,
  categoryMonthlyAmounts: [],
  badgeStats: null,
  loading: false,

  setViewMode: (viewMode) => {
    const { selectedYear, selectedMonth } = get();
    set({
      viewMode,
      baseMonth: calculateBaseMonth(viewMode, selectedYear, selectedMonth),
    });
  },

  setSelectedYear: (selectedYear) => {
    const { viewMode, selectedMonth } = get();
    set({
      selectedYear,
      baseMonth: calculateBaseMonth(viewMode, selectedYear, selectedMonth),
    });
  },

  setSelectedMonth: (selectedMonth) => {
    const { viewMode, selectedYear } = get();
    set({
      selectedMonth,
      baseMonth: calculateBaseMonth(viewMode, selectedYear, selectedMonth),
    });
  },

  getFormattedPeriod: () => {
    const { viewMode, selectedMonth, selectedYear } = get();

    if (viewMode === "month") {
      // 선택된 월의 Date 객체 (예: 2026-02-01)
      const endDateObj = new Date(`${selectedMonth}-01`);

      // 현재월 포함 12개월 전의 시작일 (예: 2025-03-01)
      const startDateObj = startOfMonth(subMonths(endDateObj, 11));

      // 선택된 월의 마지막 날 (예: 2026-02-28)
      const end = endOfMonth(endDateObj);

      return `${format(startDateObj, "yyyy.M.d")} - ${format(end, "yyyy.M.d")}`;
    } else {
      // 연간 모드는 기존과 동일하게 해당 연도 1월 1일 ~ 12월 31일
      const date = new Date(selectedYear, 0, 1);
      const start = startOfYear(date);
      const end = endOfYear(date);
      return `${format(start, "yyyy.MM.dd")} - ${format(end, "yyyy.MM.dd")}`;
    }
  },

  loadYearlyStatistics: async () => {
    const { baseMonth } = get();
    try {
      set({ loading: true });
      const yearlyData = await invoke<{
        financialSummaryStats: FinancialSummaryStats;
        monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
      } | null>("get_yearly_dashboard_data_command", { baseMonth });

      set({
        financialSummaryStats:
          yearlyData?.financialSummaryStats ?? defaultFinancialSummaryStats,
        monthlyFinancialSummary: yearlyData?.monthlyFinancialSummary ?? [],
      });
    } catch (error) {
      console.error("Failed to load yearly statistics:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadCategoryTrend: async () => {
    const { baseMonth } = get();
    try {
      set({ loading: true });
      const amounts = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        {
          baseMonth,
          categoryId: null,
        }
      );
      set({ categoryMonthlyAmounts: amounts ?? [] });
    } catch (error) {
      console.error("Failed to load category trend amounts:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadBadgeStatistics: async () => {
    const { baseMonth } = get();
    try {
      set({ loading: true });
      const stats = await invoke<BadgeStats>("get_badge_statistics_command", {
        baseMonth,
      });
      set({ badgeStats: stats });
    } catch (error) {
      console.error("Failed to load badge statistics:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadAllStatistics: async () => {
    const { loadYearlyStatistics, loadCategoryTrend, loadBadgeStatistics } =
      get();
    await Promise.all([
      loadYearlyStatistics(),
      loadCategoryTrend(),
      loadBadgeStatistics(),
    ]);
  },

  resetStatistics: () =>
    set({
      viewMode: "month",
      selectedYear: new Date().getFullYear(),
      selectedMonth: format(new Date(), "yyyy-MM"),
      baseMonth: format(new Date(), "yyyy-MM"),
      monthlyFinancialSummary: [],
      financialSummaryStats: null,
      categoryMonthlyAmounts: [],
      badgeStats: null,
      loading: false,
    }),
}));
