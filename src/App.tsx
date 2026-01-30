import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import {
  setWindowSize,
  enableResize,
  windowShow,
  setMinSize,
} from "./lib/window";
import { DashboardPage, SettingsPage, TransactionsPage } from "./pages";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import NewTransactions from "./pages/transactions/NewTransactions";
import { useAppStore } from "./store/useAppStore";
import StatisticsPage from "./pages/statistics/StatisticsPage";

type AppStage = "splash" | "onboarding" | "home";

function App() {
  const [stage, setStage] = useState<AppStage>("splash");

  const { initApp } = useAppStore();

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        await initApp();

        const initialized = await invoke<boolean>("is_app_initialized");

        setTimeout(() => {
          setStage(initialized ? "home" : "onboarding");
        }, 1000);
      } catch (e) {
        console.error(e);
        setStage("onboarding");
      }
    };
    checkInitialization();
  }, [initApp]);

  useEffect(() => {
    const handleStageChange = async () => {
      if (stage === "splash") {
        await setWindowSize(600, 500);
        await windowShow();
      }

      if (stage === "onboarding") {
        await setWindowSize(600, 500);
      }

      if (stage === "home") {
        await setWindowSize(1200, 800);
        await setMinSize(800, 600);
        await enableResize();
      }
    };
    handleStageChange();
  }, [stage]);

  if (stage === "splash")
    return (
      <div
        className={`transition-opacity duration-500 ${
          stage === "splash" ? "opacity-100" : "opacity-0"
        }`}
      >
        <SplashScreen />
      </div>
    );
  if (stage === "onboarding")
    return (
      <div
        className={`transition-opacity duration-500 ${
          stage === "onboarding" ? "opacity-100" : "opacity-0"
        }`}
      >
        <Onboarding />
      </div>
    );

  return (
    <TooltipProvider delayDuration={0}>
      <Toaster position="top-center" offset="60px" />
      <HashRouter>
        {/* Home 컴포넌트가 Sidebar와 TitleBar 레이아웃을 제공합니다 */}
        <Home>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/new" element={<NewTransactions />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Home>
      </HashRouter>
    </TooltipProvider>
  );
}

export default App;
