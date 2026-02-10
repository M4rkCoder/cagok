import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TransactionsTable from "./TransactionsTable";
import { useHeaderStore } from "@/store/useHeaderStore";
import TransactionSheet from "./TrasactionSheet";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutList } from "lucide-react";
import TransactionsFeeds from "./TransactionsFeeds";

const TransactionsPage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"timeline" | "board">("timeline");
  const { setHeader, resetHeader } = useHeaderStore();

  const sectionVariants = {
    initial: { opacity: 0, y: 15 }, // y축 이동 거리를 줄여 더 부드럽게 설정
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  useEffect(() => {
    setHeader(
      t("transactions"),
      <div className="flex items-center gap-3">
        {/* 보기 방식 전환 토글 유닛 */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 gap-1.5 transition-all ${
              viewMode === "timeline" ? "bg-white shadow-sm" : "text-slate-500"
            }`}
            onClick={() => setViewMode("timeline")}
          >
            <CalendarDays size={14} />
            <span className="text-xs font-bold">타임라인</span>
          </Button>
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 gap-1.5 transition-all ${
              viewMode === "board" ? "bg-white shadow-sm" : "text-slate-500"
            }`}
            onClick={() => setViewMode("board")}
          >
            <LayoutList size={14} />
            <span className="text-xs font-bold">게시판</span>
          </Button>
        </div>

        {/* 내역 추가 버튼 (Sheet 전용) */}
        <TransactionSheet />
      </div>,
    );
  }, [viewMode, t, setHeader]);

  useEffect(() => {
    return () => resetHeader();
  }, [resetHeader]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode} // viewMode 변경 시에만 애니메이션 작동
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-[600px]"
      >
        {viewMode === "timeline" ? (
          <TransactionsFeeds />
        ) : (
          <TransactionsTable />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionsPage;
