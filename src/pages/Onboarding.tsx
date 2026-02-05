import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, Lock, Globe, Coins } from "lucide-react"; // 아이콘 추가
import FinanceModeRounded from "@/components/FinanceModeRounded";

export default function Onboarding() {
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("ko");
  const [currency, setCurrency] = useState("KRW");
  const [password, setPassword] = useState("");

  const handleStart = async () => {
    await invoke("initialize_app", {
      appName,
      language,
      currency,
      password: password || null, // 비밀번호는 없으면 null로 전송
    });
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50/50 p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <FinanceModeRounded className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            반갑습니다!
          </CardTitle>
          <CardDescription className="text-base">
            차곡차곡 쌓아가는 첫 걸음, 설정을 완료해주세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 py-6">
          {/* 가계부 이름 */}
          <div className="space-y-2">
            <Label
              htmlFor="appName"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" /> 가계부 이름
            </Label>
            <Input
              id="appName"
              className="h-12 text-lg focus-visible:ring-primary"
              placeholder="예: 나의 소중한 자산 관리"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 언어 선택 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> 언어
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 통화 선택 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4" /> 기본 통화
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW (₩)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 비밀번호 설정 */}
          <div className="space-y-2">
            <Label
              htmlFor="pass"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Lock className="w-4 h-4" /> 보안 비밀번호 (선택)
            </Label>
            <Input
              id="pass"
              type="password"
              className="h-12 text-lg"
              placeholder="미입력 시 잠금 없이 사용"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              앱 시작 시 본인 확인을 위해 사용됩니다.
            </p>
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-8">
          <Button
            className="w-full h-14 text-lg font-bold transition-all hover:scale-[1.01]"
            onClick={handleStart}
            disabled={!appName.trim()}
          >
            가계부 만들기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
