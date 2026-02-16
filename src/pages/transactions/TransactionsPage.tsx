import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TransactionsTable from "./TransactionsTable";
import { useHeaderStore } from "@/store/useHeaderStore";
import TransactionSheet from "./TrasactionSheet";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutList, Table } from "lucide-react";
import TransactionsFeeds from "./TransactionsFeeds";
import TransactionsCalendar from "./TransactionsCalendar";
import { invoke } from "@tauri-apps/api/core";
import { Spinner } from "@/components/ui/spinner";

const TransactionsPage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"timeline" | "board" | "calendar">("timeline");
  const [isInitialized, setIsInitialized] = useState(false);
  const { setHeader, resetHeader } = useHeaderStore();

  const sectionVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  useEffect(() => {
    const loadDefaultView = async () => {
      try {
        const defaultView = await invoke<string | null>("get_setting_command", {
          key: "default_view",
        });
        if (
          defaultView === "timeline" ||
          defaultView === "calendar" ||
          defaultView === "board"
        ) {
          setViewMode(defaultView);
        }
      } catch (error) {
        console.error("Failed to load default view setting:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadDefaultView();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

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
            <LayoutList size={14} />
            <span className="text-xs font-bold">타임라인</span>
          </Button>
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 gap-1.5 transition-all ${
              viewMode === "calendar" ? "bg-white shadow-sm" : "text-slate-500"
            }`}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays size={14} />
            <span className="text-xs font-bold">달력보기</span>
          </Button>
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 gap-1.5 transition-all ${
              viewMode === "board" ? "bg-white shadow-sm" : "text-slate-500"
            }`}
            onClick={() => setViewMode("board")}
          >
            <Table size={14} />
            <span className="text-xs font-bold">표로 보기</span>
          </Button>
        </div>

        {/* 내역 추가 버튼 (Sheet 전용) */}
        <TransactionSheet />
      </div>,
    );
  }, [viewMode, t, setHeader, isInitialized]);

  useEffect(() => {
    return () => resetHeader();
  }, [resetHeader]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Spinner className="w-8 h-8 text-slate-400" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-[600px] h-full"
      >
        {viewMode === "timeline" && <TransactionsFeeds />}
        {viewMode === "board" && <TransactionsTable />}
        {viewMode === "calendar" && <TransactionsCalendar />}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionsPage;
