import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  FinancialSummaryStats,
  MonthlyFinancialSummaryItem,
  CategoryMonthlyAmount,
  MetricStats,
} from "@/types";

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
  monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
  financialSummaryStats: FinancialSummaryStats | null;
  categoryMonthlyAmounts: CategoryMonthlyAmount[];
  loading: boolean;

  // 액션
  loadYearlyStatistics: (selectedMonth: string) => Promise<void>;
  loadCategoryTrend: (
    selectedMonth: string,
    categoryId?: number | null
  ) => Promise<void>;
  resetStatistics: () => void;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  monthlyFinancialSummary: [],
  financialSummaryStats: null,
  categoryMonthlyAmounts: [],
  loading: false,

  // 연간 요약 데이터 로드 (금융 요약 통계 + 월별 바 차트용 데이터)
  loadYearlyStatistics: async (selectedMonth: string) => {
    try {
      set({ loading: true });
      const yearlyData = await invoke<{
        financialSummaryStats: FinancialSummaryStats;
        monthlyFinancialSummary: MonthlyFinancialSummaryItem[];
      } | null>("get_yearly_dashboard_data_command", {
        baseMonth: selectedMonth,
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

  // 카테고리별 월간 추이 로드 (트리맵 또는 카테고리별 시계열 차트용)
  loadCategoryTrend: async (
    selectedMonth: string,
    categoryId?: number | null
  ) => {
    try {
      set({ loading: true });
      const amounts = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        {
          baseMonth: selectedMonth,
          categoryId: categoryId ?? null,
        }
      );

      set({ categoryMonthlyAmounts: amounts ?? [] });
    } catch (error) {
      console.error("Failed to load category trend amounts:", error);
    } finally {
      set({ loading: false });
    }
  },

  // 페이지 이탈 시 데이터 초기화 (필요한 경우)
  resetStatistics: () =>
    set({
      monthlyFinancialSummary: [],
      financialSummaryStats: null,
      categoryMonthlyAmounts: [],
      loading: false,
    }),
}));
