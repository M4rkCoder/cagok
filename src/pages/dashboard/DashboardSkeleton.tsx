import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DashboardSkeleton() {
  return (
    <div className="pt-2 px-6 max-w-7xl mx-auto h-full space-y-4">
      {/* Main Expense Card Skeleton */}
      <Card className="overflow-hidden border-none shadow-md bg-white mb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Side (Summary) */}
          <div className="lg:col-span-4 p-4 flex flex-col justify-between h-[218px]">
            <div>
              <div className="flex items-center justify-between pb-8">
                <Skeleton className="h-6 w-32 bg-slate-100" /> {/* Title */}
                <Skeleton className="h-6 w-16 rounded-full bg-slate-100" />{" "}
                {/* Badge */}
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {/* Large Content Block */}
                <Skeleton className="h-16 w-3/4 rounded-md bg-slate-100" />
              </div>
            </div>
            <div className="mt-3 pb-5">
              <Skeleton className="h-10 w-full rounded-md bg-slate-100" />{" "}
              {/* Footer */}
            </div>
          </div>

          {/* Right Side (Details) */}
          <div className="lg:col-span-8 p-4 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Recent Transactions Simplified */}
              <div className="flex flex-col h-full">
                <Skeleton className="h-5 w-24 mb-4 bg-slate-100" />{" "}
                {/* Title */}
                <Skeleton className="flex-1 w-full rounded-md bg-slate-100" />{" "}
                {/* Big Block */}
              </div>

              {/* Quick Entry Simplified */}
              <div className="flex flex-col h-full">
                <Skeleton className="h-5 w-24 mb-4 bg-slate-100" />{" "}
                {/* Title */}
                <Skeleton className="flex-1 w-full rounded-md bg-slate-100" />{" "}
                {/* Big Block */}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Item Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm h-[52px]"
          >
            <Skeleton className="h-6 w-full bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Card Selection Skeleton */}
      <div className="w-full">
        {/* Mobile Tabs */}
        <div className={cn("flex w-full mb-4 ml-4 gap-10", "min-2xl:hidden")}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md bg-slate-100" />
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {/* Mobile View - Single Card */}
          <div className="min-2xl:hidden">
            <Card className="h-[300px] w-full p-5 space-y-4 border-none shadow-md">
              <div className="flex justify-between items-center mb-5">
                <Skeleton className="h-6 w-32 bg-slate-100" />
              </div>
              <Skeleton className="h-[200px] w-full rounded-md bg-slate-100" />
            </Card>
          </div>

          {/* Desktop View - Stacked Cards */}
          <div className="hidden min-2xl:flex min-2xl:flex-col min-2xl:gap-2 space-y-4">
            {/* Daily Transaction Card Style */}
            <Card className="h-[300px] w-full p-5 space-y-4 border-none shadow-md">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32 bg-slate-100" />
                <Skeleton className="h-8 w-32 rounded-md bg-slate-100" />
              </div>
              <Skeleton className="h-[200px] w-full rounded-md bg-slate-100" />
            </Card>

            {/* Day Of Week Card Style */}
            <Card className="h-[300px] w-full p-5 space-y-4 border-none shadow-md">
              <Skeleton className="h-6 w-32 mb-4 bg-slate-100" />
              <Skeleton className="h-[200px] w-full rounded-md bg-slate-100" />
            </Card>

            {/* Treemap Card Style */}
            <Card className="h-[300px] w-full p-5 space-y-4 border-none shadow-md">
              <Skeleton className="h-6 w-32 mb-4 bg-slate-100" />
              <Skeleton className="h-[200px] w-full rounded-md bg-slate-100" />
            </Card>

            {/* Top List Card Style */}
            <Card className="h-[300px] w-full p-5 space-y-4 border-none shadow-md">
              <Skeleton className="h-6 w-32 mb-4 bg-slate-100" />
              <Skeleton className="h-[200px] w-full rounded-md bg-slate-100" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
