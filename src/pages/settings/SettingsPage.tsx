import { useState } from "react";
import GeneralSettings from "./GeneralSettings";
import DbSettings from "./DbSettings";
import CategorySettings from "./CategorySettings";
import RecurringSettings from "./RecurringSettings";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  type SettingsSection = "general" | "category" | "database" | "recurring";
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  // 탭 메뉴 구성
  const tabs = [
    { id: "general", label: "일반 설정" },
    { id: "category", label: "카테고리 관리" },
    { id: "database", label: "데이터베이스 관리" },
  ];

  const sectionVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "category":
        return <CategorySettings />;
      case "database":
        return <DbSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* 상단 탭 내비게이션 */}
      <div className="flex flex-col space-y-4">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as SettingsSection)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors outline-none",
                activeSection === tab.id
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              {/* 활성화된 탭 하단 바 (Framer Motion) */}
              {activeSection === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 설정 세부 화면 (애니메이션) */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;
