import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Coins, Lock } from "lucide-react"; // 아이콘 추가
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
  const [currency, setCurrency] = useState("");
  const [password, setPassword] = useState(""); // 패스워드 상태 추가

  const updateGlobalAppName = useAppStore((state) => state.setAppName);

  // 설정 로드 함수
  const loadSettings = async () => {
    const name = await invoke<string | null>("get_setting_command", {
      key: "app_name",
    });
    const lang = await invoke<string | null>("get_setting_command", {
      key: "language",
    });
    const curr = await invoke<string | null>("get_setting_command", {
      key: "currency",
    });

    setAppName(name || "Finkro");
    setLanguage(lang || "ko");
    setCurrency(curr || "KRW");
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await invoke("set_setting_command", { key: "app_name", value: appName });
      await invoke("set_setting_command", { key: "language", value: language });
      await invoke("set_setting_command", { key: "currency", value: currency });

      // 비밀번호가 입력된 경우에만 업데이트 로직 수행
      if (password.trim() !== "") {
        // Rust 백엔드에서 password_hash를 업데이트하도록 처리
        // 만약 set_setting_command가 일반 텍스트만 저장한다면,
        // 비밀번호 전용 핸들러를 호출하는 것이 보안상 좋습니다.
        await invoke("set_setting_command", {
          key: "password_hash",
          value: password,
        });
        setPassword(""); // 저장 후 입력창 비우기
      }

      updateGlobalAppName(appName);
      toast.success("설정이 저장되었습니다.");
      await loadSettings();
    } catch (error) {
      console.error(error);
      toast.error("설정 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
          <Settings className="w-5 h-5 text-blue-600" /> 앱 기본 정보
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 가계부 이름 */}
          <div className="space-y-2">
            <Label htmlFor="appName" className="flex items-center gap-2">
              가계부 이름
            </Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Finkro"
            />
          </div>

          {/* 기본 언어 */}
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

          {/* 비밀번호 변경 */}
          <div className="space-y-2">
            <Label htmlFor="pass" className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> 보안 비밀번호 변경
            </Label>
            <Input
              id="pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="변경할 비밀번호 입력 (공백 시 유지)"
            />
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
