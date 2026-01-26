import React, { useState, useEffect } from "react"; // useState, useEffect 추가
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { TrendingUp } from "lucide-react";
import { MonthlyOverview, MonthlyExpense } from "@/types";
import CountUp from "@/components/CoutUp";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Tooltip,
  Bar,
  Cell,
} from "recharts";

interface Props {
  overview: MonthlyOverview;
  monthlyExpenses: MonthlyExpense[];
}

export function SummaryCard({ overview, monthlyExpenses }: Props) {
  // 1. 마운트 상태 관리 (에러 방지 핵심)
  const [isMounted, setIsMounted] = useState(false);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="md:col-span-3 min-w-0">
        {/* min-w-0 추가: 그리드 내부 계산 오류 방지 */}
        <CardHeader className="flex flex-row items-center justify-start gap-2 pb-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <CardTitle className="text-sm font-medium text-gray-500">
            이번 달 지출액
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between w-full">
            <div className="flex-shrink-0 text-4xl font-bold mb-4">
              ₩<CountUp end={overview.total_expense} />
            </div>

            {/* 2. 컨테이너에 고정 높이와 min-width 부여 */}
            <div className="h-[80px] max-w-[30%] w-full min-w-0">
              {/* 3. 마운트가 완료되었을 때만 ResponsiveContainer 렌더링 */}
              {isMounted && monthlyExpenses.length > 0 && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={monthlyExpenses}
                    margin={{ top: 5, right: 0, left: 10, bottom: 0 }}
                    style={{
                      outline: "none",
                      border: "none",
                      boxShadow: "none",
                    }}
                    accessibilityLayer={false}
                  >
                    {/* 호버 시 나타나는 툴팁 설정 */}
                    <Tooltip
                      cursor={false} // 막대 배경색 안나오게 설정
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded-md shadow-sm text-xs">
                              <p className="font-bold text-gray-600">
                                {payload[0].payload.year_month}
                              </p>
                              <p className="text-red-500">
                                {formatCurrency(Number(payload[0].value))}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="total_amount"
                      radius={[4, 4, 0, 0]} // 상단 모서리 둥글게
                      barSize={20} // 막대 두께 조절
                      style={{ outline: "none" }}
                      activeBar={false}
                    >
                      {monthlyExpenses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          // 마지막 데이터(이번 달)만 강조하거나 전체 같은 색상 적용
                          fill={
                            index === monthlyExpenses.length - 1
                              ? "#ef4444"
                              : "#fca5a5"
                          }
                          style={{ outline: "none", border: "none" }}
                          strokeWidth={0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-6">
          <div className="text-sm font-bold text-green-600">
            수입 ₩<CountUp end={overview.total_income} />
          </div>
          <div className="text-sm font-bold text-blue-600">
            순수입 ₩<CountUp end={overview.net_income} />
          </div>
        </CardFooter>
      </Card>

      {/* 남은 1칸을 위한 빈 카드 또는 보조 지표 */}
      <Card className="hidden md:flex md:col-span-1 items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">지출 요약 영역</p>
      </Card>
    </div>
  );
}
