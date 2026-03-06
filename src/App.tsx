import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  currentMonitor,
  LogicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import { enableResize, windowShow, setMinSize } from "./lib/window";
import { DashboardPage, SettingsPage, TransactionsPage } from "@/pages";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/stores/useAppStore";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import QuickEntry from "@/pages/transactions/QuickEntry";
import RecurringSettings from "@/pages/transactions/RecurringSettings";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import About from "./pages/About";

type AppStage = "splash" | "onboarding" | "home";

function App() {
  const [stage, setStage] = useState<AppStage>("splash");
  const { initApp } = useAppStore();
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const wrapperClass = "fixed inset-0 w-full h-full bg-white overflow-hidden";

  // ✨ 크기와 위치를 한 번에 안전하게 세팅하는 핵심 함수
  const setSafeWindowSize = async (width: number, height: number) => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();

      if (!monitor) {
        await appWindow.setSize(new LogicalSize(width, height));
        await appWindow.center();
        return;
      }

      const scale = monitor.scaleFactor;
      const monitorLogicX = monitor.position.x / scale;
      const monitorLogicY = monitor.position.y / scale;
      const monitorLogicW = monitor.size.width / scale;
      const monitorLogicH = monitor.size.height / scale;

      // 앱의 크기가 모니터의 크기보다 크거나 같다면 '최대화(Maximize)' 처리
      if (width >= monitorLogicW || height >= monitorLogicH) {
        await appWindow.maximize();
      } else {
        const isMaximized = await appWindow.isMaximized();
        if (isMaximized) {
          await appWindow.unmaximize();
          await sleep(50); // 최대화 해제 후 딜레이 추가
        }

        await appWindow.setSize(new LogicalSize(width, height));

        const targetX = monitorLogicX + monitorLogicW / 2 - width / 2;
        let targetY = monitorLogicY + monitorLogicH / 2 - height / 2;

        if (targetY < monitorLogicY) {
          targetY = monitorLogicY + 10;
        }

        await appWindow.setPosition(new LogicalPosition(targetX, targetY));
      }
    } catch (error) {
      console.error("안전한 창 크기/위치 조절 실패:", error);
    }
  };

  // ✨ 1. 사라졌던 초기화 로직 복구 (initApp 실행 및 화면 전환)
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        await setSafeWindowSize(600, 500);
        await windowShow();

        // 앱 초기화 로직 (설정 로드 등)
        await initApp();

        // DB에 초기화가 완료되었는지 확인
        const initialized = await invoke<boolean>("is_app_initialized");

        // 스플래시 화면을 1.5초 정도 보여준 후 다음 화면으로 이동
        setTimeout(() => {
          setStage(initialized ? "home" : "onboarding");
        }, 1500);
      } catch (e) {
        console.error("앱 초기화 중 오류 발생:", e);
        await windowShow();
        setStage("onboarding");
      }
    };
    checkInitialization();
  }, [initApp]);

  // ✨ 2. 중복되었던 화면 전환 로직 하나로 정리
  useEffect(() => {
    const handleStageChange = async () => {
      if (stage === "splash") {
        // 초기화 useEffect에서 처리하므로 여기선 굳이 안 해도 되지만 혹시 몰라 유지합니다.
      }
      if (stage === "onboarding") {
        await enableResize();
        await sleep(50);
        await setSafeWindowSize(1200, 800);
      }
      if (stage === "home") {
        await enableResize();
        await setMinSize(800, 600);
        await sleep(50);
        await setSafeWindowSize(1200, 800);
      }
    };
    handleStageChange();
  }, [stage]);

  return (
    <div className={wrapperClass}>
      <AnimatePresence mode="wait">
        {stage === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
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
            transition={{ duration: 0.5, ease: "easeIn" }}
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
                      <Route path="/about" element={<About />} />

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
