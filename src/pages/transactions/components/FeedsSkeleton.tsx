import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FeedsSkeleton() {
  return (
    <div className="flex flex-col w-full mb-8 animate-pulse">
      {/* 1. 월 헤더 스켈레톤 (기존 구조 완벽 복사) */}
      <div className="sticky top-10 z-30 mb-2">
        <div className="relative flex items-center justify-between gap-4 bg-white/60 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white/40 rounded-2xl">
          {/* 수직선 배경 */}
          <Skeleton className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-slate-200" />

          {/* 중앙 아이콘 자리 */}
          <Skeleton className="absolute left-[19px] top-2.5 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-slate-200 shadow-sm" />

          <div className="flex items-center justify-between w-full pl-12 pr-1">
            <div className="flex items-center gap-1.5">
              {/* 년도/월 자리 */}
              <Skeleton className="ml-5 mb-5 h-4 w-30 bg-slate-200/70" />
            </div>

            {/* 오른쪽 트렌드 배지 자리 */}
            <div className="flex items-center gap-1">
              <Skeleton className="mb-4 mr-3 h-5 w-25 rounded-lg bg-slate-100" />
              <div className="w-[1px] h-3 mb-6 mr-4 bg-slate-200" />
              <Skeleton className="mb-4 mr-3 h-5 w-25 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 일별 카드 스켈레톤 (DailySummaryCard 형태 모방) */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="relative z-10 flex flex-col mb-2">
          <div className="flex gap-4 group items-start">
            <div className="flex flex-col items-center flex-shrink-0 w-10">
              <div className="mt-5.5 w-2.5 h-2.5 rounded-full border-2 bg-white border-slate-300" />
            </div>

            <div className="flex-1 flex items-center justify-between py-3.5 px-5 rounded-xl border border-slate-200 shadow-sm mb-0.5">
              <Skeleton className="h-5 w-24 bg-slate-200/60" />

              {/* 카드 내부 오른쪽 */}
              <div className="flex gap-4">
                <Skeleton className="h-7 w-25 rounded-xl bg-slate-200/40" />
                <Skeleton className="h-7 w-25 rounded-xl bg-slate-200/40" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
