import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getPeriodComparison } from "@/lib/api/dashbaord";
import {
  MonthlyOverview,
  CategoryExpense,
  DailyExpense,
  MonthlyExpense,
  ComparisonType,
  ComparisonMetric,
} from "@/types";

export function useDashboard(selectedMonth: string) {
  const [overview, setOverview] = useState<MonthlyOverview | null>(null);
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [comparisons, setComparisons] = useState<
    Record<ComparisonType, ComparisonMetric | null>
  >({
    Expense: null,
    Income: null,
    NetIncome: null,
    FixedRatio: null,
  });
  const [loading, setLoading] = useState(true);

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

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const { current, previous } = getMonthRange(selectedMonth);

      const types: ComparisonType[] = [
        "Income",
        "Expense",
        "NetIncome",
        "FixedRatio",
      ];

      const [
        overviewData,
        categoriesData,
        dailyData,
        monthlyData,
        comparisonData,
      ] = await Promise.all([
        invoke<MonthlyOverview>("get_monthly_overview", {
          yearMonth: selectedMonth,
        }),
        invoke<CategoryExpense[]>("get_category_expenses", {
          yearMonth: selectedMonth,
        }),
        invoke<DailyExpense[]>("get_daily_expenses", {
          yearMonth: selectedMonth,
        }),
        invoke<MonthlyExpense[]>("get_monthly_expenses", { months: 6 }),
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

      const comparisonMap = comparisonData.reduce((acc, { type, data }) => {
        acc[type] = data;
        return acc;
      }, {} as Record<ComparisonType, ComparisonMetric>);

      setOverview(overviewData);
      setCategories(categoriesData);
      setDailyExpenses(dailyData);
      setMonthlyExpenses(monthlyData);
      setComparisons(comparisonMap);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) loadDashboardData();
  }, [selectedMonth]);

  return {
    loading,
    overview,
    categories,
    dailyExpenses,
    monthlyExpenses,
    comparisons,
  };
}
