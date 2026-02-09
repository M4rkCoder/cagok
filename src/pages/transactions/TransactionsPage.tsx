import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TransactionsTable from "./TransactionsTable";
import { useHeaderStore } from "@/store/useHeaderStore";
import TransactionSheet from "./TrasactionSheet";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutList, TableProperties, Zap } from "lucide-react";
import QuickEntry from "./QuickEntry";
import TransactionsFeeds from "./TransactionsFeeds";

const TransactionsPage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"timeline" | "board">("timeline");
  const { setHeader, resetHeader, activeSection, setActiveSection } =
    useHeaderStore();

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // 1. 초기 섹션을 "feeds"로 설정
  useEffect(() => {
    setActiveSection("feeds");
  }, []);

  useEffect(() => {
    setHeader(
      t("transactions"),
      <div className="flex items-center gap-2">
        {/* 2. 조건문을 "feeds"로 수정 */}
        {activeSection === "feeds" && (
          <>
            {/* 보기 방식 전환 토글 */}
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2 border border-slate-200">
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 gap-1.5 ${viewMode === "timeline" ? "bg-white shadow-sm" : "text-slate-500"}`}
                onClick={() => setViewMode("timeline")}
              >
                <CalendarDays size={14} />
                <span className="text-xs font-bold">타임라인</span>
              </Button>
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 gap-1.5 ${viewMode === "board" ? "bg-white shadow-sm" : "text-slate-500"}`}
                onClick={() => setViewMode("board")}
              >
                <LayoutList size={14} />
                <span className="text-xs font-bold">게시판</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveSection("quickinput")}
            >
              <Zap size={16} fill="currentColor" />
              빠른 입력
            </Button>
            <TransactionSheet />
          </>
        )}

        {activeSection === "quickinput" && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setActiveSection("feeds")} // 3. 돌아갈 때도 "feeds"로 설정
          >
            <TableProperties size={16} />
            내역 조회로 돌아가기
          </Button>
        )}
      </div>
    );
  }, [activeSection, viewMode, t, setHeader]); // setHeader 의존성 추가 권장

  useEffect(() => {
    return () => resetHeader();
  }, []);

  const renderActiveComponent = () => {
    if (activeSection === "quickinput") return <QuickEntry />;

    // 4. "feeds" 섹션일 때 viewMode에 따라 분기
    return viewMode === "timeline" ? (
      <TransactionsFeeds />
    ) : (
      <TransactionsTable />
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeSection}-${viewMode}`}
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-[600px]"
      >
        {renderActiveComponent()}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionsPage;
