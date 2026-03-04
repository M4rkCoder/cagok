import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { CategoryIcon } from "@/components/CategoryIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter"; // 🔹 훅 임포트
import { useTranslation } from "react-i18next";

const TreemapDetailDialog = () => {
  const { t } = useTranslation();
  const { treemapDialogOpen, setTreemapDialogOpen, detailData } =
    useDashboardStore();
  const { formatAmount } = useCurrencyFormatter();
  const { formatMonth } = useDateFormatter(); // 🔹 포맷터 훅 사용

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
                      {isFixed
                        ? t("transaction_filter.modes.fixed_expense")
                        : t("transaction_filter.modes.variable_expense")}
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
                        {formatAmount(detailData?.total_amount)}
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
                      detailData.items.map((tx, idx) => {
                        // 🔹 커스텀 훅을 통해 월 문자열 변환 ("3월" 또는 "Mar")
                        const monthStr = formatMonth(tx.date, "short");

                        // 🔹 일(Day)은 배지에 깔끔하게 숫자만 들어가도록 Date 내장 객체 사용
                        const dateObj = new Date(tx.date);
                        const dayNum = !isNaN(dateObj.getTime())
                          ? dateObj.getDate()
                          : "";

                        return (
                          <motion.div
                            key={`${tx.id}-${idx}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            {/* 원형 날짜 배지 */}
                            <div className="flex flex-col items-center justify-center w-[38px] h-[38px] rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mt-0.5">
                                {monthStr}
                              </span>
                              <span className="text-[14px] font-black text-slate-700 dark:text-slate-200 leading-none mt-0.5">
                                {dayNum}
                              </span>
                            </div>

                            {/* 내역 설명 */}
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                {tx.description || tx.category_name}
                              </span>
                            </div>

                            {/* 금액 */}
                            <div className="text-right ml-2 flex-shrink-0">
                              <span
                                className={`text-[13px] font-bold tabular-nums ${themeColor}`}
                              >
                                {formatAmount(tx.amount)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="py-24 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                          {t("common.no_results")}
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
                  {t("transaction_filter.confirm")}
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
