import { useState, useEffect } from "react";
import GeneralSettings from "./GeneralSettings";
import DbSettings from "./DbSettings";
import CategorySettings from "./CategorySettings";
import SyncSettings from "./SyncSettings";
import { AnimatedTabs, TabItem, TabContent } from "@/components/AnimatedTabs";
import { Cloudy, Database, Settings, Shapes } from "lucide-react";

const SettingsPage = ({
  defaultSection = "general",
}: {
  defaultSection?: string;
}) => {
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    setActiveSection(defaultSection);
  }, [defaultSection]);

  const tabs: TabItem[] = [
    { id: "general", label: "일반 설정", icon: Settings },
    { id: "category", label: "카테고리 관리", icon: Shapes },
    { id: "database", label: "데이터베이스 관리", icon: Database },
    { id: "sync", label: "동기화 설정", icon: Cloudy },
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
