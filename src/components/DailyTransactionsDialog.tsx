import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ReceiptText } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { motion, AnimatePresence } from "framer-motion"; // 추가

const DailyTransactionsDialog = () => {
  const {
    dialogState,
    closeDialog,
    detailData,
    detailLoading,
    loadChartDetail,
  } = useDashboardStore();

  const { isOpen, date, txType, categoryId } = dialogState;

  useEffect(() => {
    if (isOpen && date) {
      loadChartDetail(date, txType, categoryId);
    }
  }, [isOpen, date, txType, categoryId, loadChartDetail]);

  const formattedDate = date
    ? format(new Date(date), "M.d (eee)", { locale: ko })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent
        onWheel={(e) => e.stopPropagation()}
        // 기존 shadcn 애니메이션을 무력화하기 위해 data-[state] 클래스들을 커스텀하거나
        // Framer Motion과 충돌하지 않도록 스타일을 조정합니다.
        className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-none"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
              className="flex flex-col h-[500px] max-h-[80vh] w-full bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border"
            >
              {/* Header */}
              <DialogHeader className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b flex-shrink-0">
                <div className="flex items-center justify-between w-full pr-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        txType === 0
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <DialogTitle className="text-base font-bold">
                        {txType === 0 ? "수입" : "지출"} 내역
                        {detailData?.is_fixed_view !== undefined && (
                          <span className="ml-1.5 text-xs font-medium text-slate-400">
                            ({detailData.is_fixed_view ? "고정" : "변동"})
                          </span>
                        )}
                      </DialogTitle>
                      <span className="text-[12px] text-slate-500 font-bold mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-lg font-black tracking-tight ${
                        txType === 0 ? "text-emerald-600" : "text-blue-700"
                      }`}
                    >
                      {detailData?.total_amount?.toLocaleString() || 0}
                      <small className="text-xs ml-0.5 font-normal text-slate-500">
                        원
                      </small>
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* Scroll Area */}
              <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-slate-950">
                <ScrollArea className="h-full w-full">
                  <div className="p-2 space-y-1">
                    {detailLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                        />
                        <p className="text-xs text-slate-400 font-medium">
                          데이터 로딩 중...
                        </p>
                      </div>
                    ) : detailData?.items && detailData.items.length > 0 ? (
                      detailData.items.map((tx, idx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }} // 리스트도 아래에서 위로
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
                          className="flex items-center justify-between p-2 ..."
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon
                              type={txType}
                              size="sm"
                              icon={tx.category_icon || "💰"}
                            />
                            <div className="flex flex-col leading-tight">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {tx.description || tx.category_name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tx.category_name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                tx.type === 0
                                  ? "text-emerald-600"
                                  : "text-blue-700"
                              }`}
                            >
                              {tx.amount.toLocaleString()}
                              <small className="text-xs ml-0.5 font-normal text-slate-500">
                                원
                              </small>
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-xs text-slate-400">
                          조회된 내역이 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <ScrollBar orientation="vertical" className="w-2.5" />
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t mt-auto">
                <button
                  onClick={closeDialog}
                  className="w-full py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all outline-none"
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

export default DailyTransactionsDialog;
