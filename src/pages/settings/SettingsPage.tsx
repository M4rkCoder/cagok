import { useState, useEffect } from "react";
import GeneralSettings from "./GeneralSettings";
import DbSettings from "./DbSettings";
import CategorySettings from "./CategorySettings";
import SyncSettings from "./SyncSettings";
import { AnimatedTabs, TabItem, TabContent } from "@/components/AnimatedTabs";
import { Cloudy, Database, Settings, Shapes } from "lucide-react";

import { useTranslation } from "react-i18next";

const SettingsPage = ({
  defaultSection = "general",
}: {
  defaultSection?: string;
}) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    setActiveSection(defaultSection);
  }, [defaultSection]);

  const tabs: TabItem[] = [
    { id: "general", label: t("settings.tabs.general"), icon: Settings },
    { id: "category", label: t("settings.tabs.category"), icon: Shapes },
    { id: "database", label: t("settings.tabs.database"), icon: Database },
    { id: "sync", label: t("settings.tabs.sync"), icon: Cloudy },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "category":
        return <CategorySettings />;
      case "database":
        return <DbSettings />;
      case "sync":
        return <SyncSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeSection}
        onChange={setActiveSection}
        layoutId="settingsTabMenu"
      />

      <div className="relative min-h-[400px]">
        <TabContent activeKey={activeSection}>{renderContent()}</TabContent>
      </div>
    </div>
  );
};

export default SettingsPage;
