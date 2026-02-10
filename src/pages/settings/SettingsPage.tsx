import { useState } from "react";
import GeneralSettings from "./GeneralSettings";
import DbSettings from "./DbSettings";
import CategorySettings from "./CategorySettings";
import RecurringSettings from "./RecurringSettings";
import { DotNavigation } from "@/components/DotNavigation";
import { motion, AnimatePresence } from "framer-motion";

const SettingsPage = () => {
  type SettingsSection = "general" | "category" | "database" | "recurring";
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  const sections = [
    { id: "general", label: "일반 설정" },
    { id: "category", label: "카테고리 설정" },
    { id: "database", label: "DB 설정" },
  ];

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const subSections = [
    { id: "general", component: <GeneralSettings /> },
    { id: "category", component: <CategorySettings /> },
    { id: "database", component: <DbSettings /> },
    { id: "recurring", component: <RecurringSettings /> },
  ];

  const activeComponent = subSections.find((item) => item.id === activeSection);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <DotNavigation
        sections={sections}
        activeId={activeSection}
        onChange={(id) => setActiveSection(id as SettingsSection)}
      />
      <AnimatePresence mode="wait">
        {activeComponent && (
          <motion.div
            key={activeSection}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {activeComponent.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
