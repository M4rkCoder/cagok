import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";

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

  if (stage === "splash") return <SplashScreen />;
  if (stage === "onboarding") return <Onboarding />;

  return <Home />;
}

export default App;
