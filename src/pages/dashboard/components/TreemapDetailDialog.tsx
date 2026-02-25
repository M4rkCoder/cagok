import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { ReceiptText } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { motion, AnimatePresence } from "framer-motion";

const TreemapDetailDialog = () => {
  const { treemapDialogOpen, setTreemapDialogOpen, detailData } =
    useDashboardStore();

  const isFixed = detailData?.is_fixed_view === true;
  const categoryName = detailData?.items?.[0]?.category_name || "카테고리";
  const categoryIcon = detailData?.items?.[0]?.category_icon || "💰";

  // 테마 색상 설정
  const themeColor = isFixed ? "text-slate-700" : "text-orange-600";
  const badgeBg = isFixed
    ? "bg-slate-100 text-slate-600"
    : "bg-orange-100 text-orange-600";

  return (
    <Dialog open={treemapDialogOpen} onOpenChange={setTreemapDialogOpen}>
      <DialogContent
        onWheel={(e) => e.stopPropagation()}
        className="sm:max-w-[380px] p-0 overflow-hidden border-none bg-transparent shadow-none"
      >
        <AnimatePresence mode="wait">
          {treemapDialogOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="flex flex-col h-[500px] max-h-[80vh] w-full bg-white dark:bg-slate-950 rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <DialogHeader className="p-5 pb-4 bg-white dark:bg-slate-950 border-b flex-shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeBg}`}
                    >
                      {isFixed ? "고정" : "변동"} 지출
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      <span className="flex-shrink-0 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg">
                        <CategoryIcon icon={categoryIcon} type={1} size="sm" />
                      </span>
                      {categoryName}
                    </DialogTitle>
                    <div className="text-right">
                      <span
                        className={`text-xl font-black tracking-tighter ${themeColor}`}
                      >
                        {detailData?.total_amount?.toLocaleString()}
                        <small className="text-[11px] ml-0.5 font-bold text-slate-400">
                          원
                        </small>
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Compact List Area */}
              <div className="flex-1 min-h-0 bg-white dark:bg-slate-950">
                <ScrollArea className="h-full w-full">
                  <div className="divide-y divide-slate-100 dark:divide-slate-900">
                    {detailData?.items && detailData.items.length > 0 ? (
                      detailData.items.map((tx, idx) => (
                        <motion.div
                          key={`${tx.id}-${idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                              {tx.description || tx.category_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                              {tx.date || "내역 확인"}
                            </span>
                          </div>
                          <div className="text-right ml-4">
                            <span
                              className={`text-[13px] font-bold tabular-nums ${themeColor}`}
                            >
                              {tx.amount.toLocaleString()}
                              <small className="text-[10px] ml-0.5 font-medium text-slate-400">
                                원
                              </small>
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-24 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                          조회된 내역이 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="p-4 bg-white dark:bg-slate-950 border-t">
                <button
                  onClick={() => setTreemapDialogOpen(false)}
                  className="w-full py-2.5 text-[13px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all outline-none"
                >
                  확인
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default TreemapDetailDialog;
