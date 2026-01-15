import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import {
  setWindowSize,
  enableResize,
  windowShow,
  setMinSize,
} from "./lib/window";

type AppStage = "splash" | "onboarding" | "home";

function App() {
  const [stage, setStage] = useState<AppStage>("splash");

  useEffect(() => {
    const checkInitialization = async () => {
      try {
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
  }, []);

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
    <div
      className={`transition-opacity duration-500 ${
        stage === "home" ? "opacity-100" : "opacity-0"
      }`}
    >
      <Home />
    </div>
  );
}

export default App;
