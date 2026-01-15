import { useState } from "react";
import { Button } from "@/components/ui/button";
import DbSettings from "./DbSettings";
import CategorySettings from "./CategorySettings";
import RecurringSettings from "./RecurringSettings";

type SettingPageType = "db" | "category" | "recurring";

const SettingsPage = () => {
  const [activeSetting, setActiveSetting] =
    useState<SettingPageType>("db");

  const getButtonVariant = (
    buttonType: SettingPageType
  ): "default" | "outline" => {
    return activeSetting === buttonType ? "default" : "outline";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex space-x-2 border-b pb-4">
        <Button
          variant={getButtonVariant("db")}
          onClick={() => setActiveSetting("db")}
        >
          데이터베이스
        </Button>
        <Button
          variant={getButtonVariant("category")}
          onClick={() => setActiveSetting("category")}
        >
          카테고리
        </Button>
        <Button
          variant={getButtonVariant("recurring")}
          onClick={() => setActiveSetting("recurring")}
        >
          반복 지출
        </Button>
      </div>

      <div>
        {activeSetting === "db" && <DbSettings />}
        {activeSetting === "category" && <CategorySettings />}
        {activeSetting === "recurring" && <RecurringSettings />}
      </div>
    </div>
  );
};

export default SettingsPage;
