import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DailyTransactionCard from "./DailyTransactionCard";
import { DayOfWeekChart } from "./DayOfWeekChart";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

type ViewMode = "expense" | "income";

export default function AnalysisTabs() {
  const { selectedMonth } = useDashboardStore();
  const [viewMode, setViewMode] = useState<ViewMode>("expense");

  return (
    <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden mt-4">
      <Tabs defaultValue="daily" className="w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <TabsList className="h-8 bg-slate-100 p-0.5">
            <TabsTrigger 
              value="daily" 
              className="text-xs font-medium h-7 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
            >
              일별 추이
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              className="text-xs font-medium h-7 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
            >
              요일별 분석
            </TabsTrigger>
          </TabsList>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto mr-4">
            <TabsList className="h-8 bg-slate-100 p-0.5 grid grid-cols-2 w-[140px]">
              <TabsTrigger 
                value="expense" 
                className="text-xs font-medium h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
              >
                지출
              </TabsTrigger>
              <TabsTrigger 
                value="income" 
                className="text-xs font-medium h-7 px-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
              >
                수입
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="daily" className="mt-0">
            <DailyTransactionCard embedded={true} viewMode={viewMode} />
          </TabsContent>
          
          <TabsContent value="weekly" className="mt-0">
            <DayOfWeekChart baseMonth={selectedMonth} compact={true} viewMode={viewMode} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
