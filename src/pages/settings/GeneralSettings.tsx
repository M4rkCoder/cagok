import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Coins, LayoutTemplate } from "lucide-react";
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
  const { resetHeader, setHeader } = useHeaderStore();

  useEffect(() => {
    setHeader("설정");
    return () => resetHeader();
  }, []);

  const [localAppName, setLocalAppName] = useState("");
  const [localLanguage, setLocalLanguage] = useState("");
  const [currency, setCurrency] = useState("");
  const [localDefaultView, setLocalDefaultView] = useState("timeline");

  const {
    language: globalLanguage,
    updateSetting,
    setAppName: updateGlobalAppName,
  } = useAppStore();

  const loadSettings = async () => {
    const name = await invoke<string | null>("get_setting_command", {
      key: "app_name",
    });
    const curr = await invoke<string | null>("get_setting_command", {
      key: "currency",
    });
    const defaultView = await invoke<string | null>("get_setting_command", {
      key: "default_view",
    });

    setLocalAppName(name || "C'agok");
    setLocalLanguage(globalLanguage);
    setCurrency(curr || "KRW");
    setLocalDefaultView(defaultView || "timeline");
  };

  useEffect(() => {
    loadSettings();
  }, [globalLanguage]);

  const handleSaveSettings = async () => {
    try {
      await invoke("set_setting_command", {
        key: "app_name",
        value: localAppName,
      });
      await invoke("set_setting_command", { key: "currency", value: currency });
      await invoke("set_setting_command", {
        key: "default_view",
        value: localDefaultView,
      });
      await updateSetting("language", localLanguage);

      updateGlobalAppName(localAppName);
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("설정 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
          <Settings className="w-5 h-5" /> 일반 설정
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 가계부 이름 */}
          <div className="space-y-2">
            <Label htmlFor="appName" className="flex items-center gap-2">
              가계부 이름
            </Label>
            <Input
              id="appName"
              value={localAppName}
              onChange={(e) => setLocalAppName(e.target.value)}
              placeholder="C'agok"
            />
          </div>

          {/* 기본 언어 */}
          <div className="space-y-2">
            <Label htmlFor="language">기본 언어</Label>
            <Select value={localLanguage} onValueChange={setLocalLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="언어 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 통화 설정 */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-2">
              <Coins className="w-4 h-4" /> 통화 단위
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="통화 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KRW">KRW (₩)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 기본 보기 설정 */}
          <div className="space-y-2">
            <Label htmlFor="defaultView" className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> 내역 기본 보기
            </Label>
            <Select
              value={localDefaultView}
              onValueChange={setLocalDefaultView}
            >
              <SelectTrigger id="defaultView">
                <SelectValue placeholder="보기 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">타임라인 (기본)</SelectItem>
                <SelectItem value="calendar">달력 보기</SelectItem>
                <SelectItem value="board">표로 보기</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveSettings} className="w-full md:w-32">
            설정 저장
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GeneralSettings;
