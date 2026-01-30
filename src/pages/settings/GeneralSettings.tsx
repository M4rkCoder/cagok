import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useHeaderStore } from "@/store/useHeaderStore";

const GeneralSettings = () => {
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);
  useEffect(() => {
    setHeader("일반 설정");

    return () => resetHeader();
  }, []);

  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("");

  const updateGlobalAppName = useAppStore((state) => state.setAppName);

  useEffect(() => {
    invoke<string | null>("get_setting_command", { key: "app_name" }).then(
      (v) => setAppName(v || "Finkro")
    );

    invoke<string | null>("get_setting_command", { key: "language" }).then(
      (v) => setLanguage(v || "ko")
    );
  }, []);

  const handleSaveSettings = async () => {
    await invoke("set_setting_command", { key: "app_name", value: appName });
    await invoke("set_setting_command", { key: "language", value: language });
    updateGlobalAppName(appName);
    toast.success("설정이 저장되었습니다.");
    invoke<string | null>("get_setting_command", { key: "app_name" }).then(
      (v) => setAppName(v || "Finkro")
    );
    invoke<string | null>("get_setting_command", { key: "language" }).then(
      (v) => setLanguage(v || "ko")
    );
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Settings className="w-5 h-5" />앱 기본 정보
      </div>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appName">가계부 이름</Label>
          <Input
            id="appName"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Finkro"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">기본 언어</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="언어 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleSaveSettings}>저장</Button>
    </Card>
  );
};

export default GeneralSettings;
