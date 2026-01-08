import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Wallet,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 타입 정의
interface MonthlyOverview {
  total_income: number;
  total_expense: number;
  net_income: number;
  fixed_expense_ratio: number;
}

interface CategoryExpense {
  category_id: number;
  category_name: string;
  category_icon: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
  [key: string]: string | number;
}

interface DailyExpense {
  date: string;
  total_amount: number;
  transaction_count: number;
  [key: string]: string | number;
}

interface MonthlyExpense {
  year_month: string;
  total_amount: number;
  transaction_count: number;
  [key: string]: string | number;
}

// 차트 색상
const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [overview, setOverview] = useState<MonthlyOverview | null>(null);
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // 현재 연월 가져오기
  useEffect(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setSelectedMonth(yearMonth);
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (selectedMonth) {
      loadDashboardData();
    }
  }, [selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, categoriesData, dailyData, monthlyData] =
        await Promise.all([
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
        ]);

      setOverview(overviewData);
      setCategories(categoriesData);
      setDailyExpenses(dailyData);
      setMonthlyExpenses(monthlyData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-500 mt-1">가계부 통계 및 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 수입
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overview.total_income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 지출
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overview.total_expense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              순수익
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                overview.net_income >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(overview.net_income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              고정비 비율
            </CardTitle>
            <PiggyBank className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.fixed_expense_ratio.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 (파이 차트) */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 지출</CardTitle>
            <CardDescription>전체 지출 대비 카테고리별 비율</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) =>
                      `${entry.category_name} (${entry.percentage.toFixed(1)}%)`
                    }
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리별 지출 (막대 차트) */}
        <Card>
          <CardHeader>
            <CardTitle>지출 상위 카테고리</CardTitle>
            <CardDescription>카테고리별 지출 금액</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categories.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="total_amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 일별/월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 지출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>일별 지출 추이</CardTitle>
            <CardDescription>이번 달 일별 지출 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `날짜: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_amount"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* 월별 지출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 지출 추이</CardTitle>
            <CardDescription>최근 6개월 지출 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year_month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="total_amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 상세 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 상세 내역</CardTitle>
          <CardDescription>전체 카테고리 지출 정보</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length] + "20",
                      }}
                    >
                      {category.category_icon}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {category.category_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.transaction_count}건의 거래
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(category.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
