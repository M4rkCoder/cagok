import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TransactionsTable from "./TransactionsTable";
import QuickInputTransaction from "./QuickInputTransaction";
import { useHeaderStore } from "@/store/useHeaderStore";
import TransactionSheet from "./TrasactionSheet";
import { Button } from "@/components/ui/button";
import { TableProperties } from "lucide-react";

const TransactionsPage = () => {
  const { t } = useTranslation();

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const subSections = [
    { id: "table", component: <TransactionsTable /> },
    { id: "quickinput", component: <QuickInputTransaction /> },
  ];
  const { setHeader, resetHeader, activeSection, setActiveSection } =
    useHeaderStore();

  useEffect(() => {
    setActiveSection("table");
  }, []);

  useEffect(() => {
    setHeader(
      t("transactions"),
      <>
        {activeSection === "table" && (
          <>
            <Button
              variant="outline"
              onClick={() => setActiveSection("quickinput")}
            >
              <TableProperties className="mr-1" />
              간편 대량 입력
            </Button>
            <TransactionSheet />
          </>
        )}

        {activeSection === "quickinput" && (
          <Button variant="outline" onClick={() => setActiveSection("table")}>
            리스트 보기
          </Button>
        )}
      </>
    );
  }, [activeSection, t]);

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, []);
  const activeComponent = subSections.find((item) => item.id === activeSection);

  return (
    <AnimatePresence mode="wait">
      {activeComponent && (
        <motion.div
          key={activeSection}
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="min-h-[100vh]"
        >
          {activeComponent.component}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionsPage;
