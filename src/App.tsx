import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import {
  setWindowSize,
  enableResize,
  windowShow,
  setMinSize,
} from "./lib/window";
import { DashboardPage, SettingsPage, TransactionsPage } from "@/pages";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/useAppStore";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import QuickEntry from "@/pages/transactions/QuickEntry";
import RecurringSettings from "@/pages/transactions/RecurringSettings";
import { NotificationProvider } from "@/components/providers/NotificationProvider";

type AppStage = "splash" | "onboarding" | "home";

function App() {
  const [stage, setStage] = useState<AppStage>("splash");
  const { initApp } = useAppStore();

  // 1. 초기 배경색 및 높이 고정 (Layout Shift 방지)
  const wrapperClass = "fixed inset-0 w-full h-full bg-white overflow-hidden";

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        await setWindowSize(600, 500);
        await initApp();
        await windowShow();
        const initialized = await invoke<boolean>("is_app_initialized");

        // 렌더링 준비 시간을 위해 1.5초 정도로 약간 늘림
        setTimeout(() => {
          setStage(initialized ? "home" : "onboarding");
        }, 1500);
      } catch (e) {
        console.error(e);
        await windowShow();
        setStage("onboarding");
      }
    };
    checkInitialization();
  }, [initApp]);

  // 창 크기 조절 로직 동일
  useEffect(() => {
    const handleStageChange = async () => {
      if (stage === "splash") {
        await setWindowSize(600, 500);
        await windowShow();
      }
      if (stage === "onboarding") {
        await setWindowSize(1200, 800);
      }
      if (stage === "home") {
        await setWindowSize(1200, 800);
        await setMinSize(800, 600);
        await enableResize();
      }
    };
    handleStageChange();
  }, [stage]);

  return (
    // 최상위 컨테이너에 배경색을 박아서 흰색 깜빡임을 방지합니다.
    <div className={wrapperClass}>
      <AnimatePresence mode="wait">
        {stage === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }} // 처음엔 바로 보여야 함
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full flex items-center justify-center"
          >
            <SplashScreen />
          </motion.div>
        )}

        {stage === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <Onboarding />
          </motion.div>
        )}

        {stage === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeIn" }} // 부드럽게 페이드인
            className="w-full h-full"
          >
            <NotificationProvider>
              <TooltipProvider delayDuration={0}>
                <Toaster position="top-center" offset="60px" />
                <HashRouter>
                  <Home>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route
                        path="/transactions"
                        element={<TransactionsPage />}
                      />
                      <Route
                        path="/transactions/quickentry"
                        element={<QuickEntry />}
                      />
                      <Route
                        path="/transactions/recurring"
                        element={<RecurringSettings />}
                      />
                      <Route path="/statistics" element={<StatisticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route
                        path="/settings/db"
                        element={<SettingsPage defaultSection="database" />}
                      />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Home>
                </HashRouter>
              </TooltipProvider>
            </NotificationProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
