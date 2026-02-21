import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  FinancialSummaryStats,
  MonthlyFinancialSummaryItem,
  CategoryMonthlyAmount,
  MetricStats,
  BadgeStats,
} from "@/types";
import { format } from "date-fns";

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
  baseMonth: string; // viewMode와 selectedYear/Month에 의해 계산됨

  monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
  financialSummaryStats: FinancialSummaryStats | null;
  categoryMonthlyAmounts: CategoryMonthlyAmount[];
  badgeStats: BadgeStats | null;
  loading: boolean;

  // 액션
  setViewMode: (viewMode: "year" | "month") => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: string) => void;

  loadYearlyStatistics: () => Promise<void>;
  loadCategoryTrend: () => Promise<void>;
  loadBadgeStatistics: () => Promise<void>;
  loadAllStatistics: () => Promise<void>;
  resetStatistics: () => void;
}

const calculateBaseMonth = (
  viewMode: "year" | "month",
  selectedYear: number,
  selectedMonth: string,
) => {
  return viewMode === "year" ? `${selectedYear}-12` : selectedMonth;
};

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  // 초기 상태
  viewMode: "month",
  selectedYear: new Date().getFullYear(),
  selectedMonth: format(new Date(), "yyyy-MM"),
  baseMonth: format(new Date(), "yyyy-MM"),

  monthlyFinancialSummary: [],
  financialSummaryStats: null,
  categoryMonthlyAmounts: [],
  badgeStats: null,
  loading: false,

  // 액션
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

  // 연간 요약 데이터 로드
  loadYearlyStatistics: async () => {
    const { baseMonth } = get();
    try {
      set({ loading: true });
      const yearlyData = await invoke<{
        financialSummaryStats: FinancialSummaryStats;
        monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
      } | null>("get_yearly_dashboard_data_command", {
        baseMonth,
      });

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

  // 카테고리별 월간 추이 로드
  loadCategoryTrend: async () => {
    const { baseMonth } = get();
    try {
      set({ loading: true });
      const amounts = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        {
          baseMonth,
          categoryId: null,
        },
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
    const {
      loadYearlyStatistics,
      loadCategoryTrend,
      loadBadgeStatistics,
    } = get();
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
