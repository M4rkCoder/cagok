import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TransactionsTable from "./TransactionsTable";
import { useHeaderStore } from "@/store/useHeaderStore";
import TransactionSheet from "./TrasactionSheet";
import { Button } from "@/components/ui/button";
import { TableProperties, Zap } from "lucide-react";
import QuickEntry from "./QuickEntry";

const TransactionsPage = () => {
  const { t } = useTranslation();

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const subSections = [
    { id: "table", component: <TransactionsTable /> },
    { id: "quickinput", component: <QuickEntry /> },
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
              <Zap className="mr-1" />
              빠른 입력
            </Button>
            <TransactionSheet />
          </>
        )}

        {activeSection === "quickinput" && (
          <Button variant="outline" onClick={() => setActiveSection("table")}>
            <TableProperties />
            내역 조회
          </Button>
        )}
      </>,
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
          className="min-h-[653px]"
        >
          {activeComponent.component}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionsPage;
