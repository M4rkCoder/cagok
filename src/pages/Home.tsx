import { useState, useEffect } from "react";
import { DashboardPage, TransactionsPage, SettingsPage } from "@/pages";
import { Button } from "@/components/ui/button";
import TitleBar from "@/TitleBar";

function Home() {
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "transactions" | "settings"
  >("dashboard");

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 shrink-0">
        <TitleBar />
      </div>
      <main
        className="flex-1 overflow-auto"
        style={{ fontFamily: "sans-serif" }}
      >
        <nav
          style={{
            marginBottom: "20px",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px",
          }}
        >
          <button
            onClick={() => setCurrentPage("dashboard")}
            style={{
              padding: "8px 15px",
              backgroundColor:
                currentPage === "dashboard" ? "#007bff" : "#f0f0f0",
              color: currentPage === "dashboard" ? "white" : "black",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage("transactions")}
            style={{
              padding: "8px 15px",
              backgroundColor:
                currentPage === "transactions" ? "#007bff" : "#f0f0f0",
              color: currentPage === "transactions" ? "white" : "black",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Transactions
          </button>
          <button
            onClick={() => setCurrentPage("settings")}
            style={{
              marginRight: "10px",
              padding: "8px 15px",
              backgroundColor:
                currentPage === "settings" ? "#007bff" : "#f0f0f0",
              color: currentPage === "settings" ? "white" : "black",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Settings
          </button>
          <Button
            variant="secondary"
            onClick={async () => {
              const seed = await import("@/db/seed");
            }}
          >
            더미 데이터 생성
          </Button>
        </nav>

        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "transactions" && <TransactionsPage />}
        {currentPage === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default Home;
