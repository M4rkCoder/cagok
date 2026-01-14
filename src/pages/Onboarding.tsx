import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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

export default function Onboarding() {
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("ko");

  const handleStart = async () => {
    await invoke("initialize_app", {
      appName,
      language,
    });
    window.location.reload(); // 가장 단순하고 안전
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-100">
        <CardHeader>
          <CardTitle>가계부 시작하기</CardTitle>
          <CardDescription>앱 이름과 기본 설정을 정해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="가계부 이름"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="언어 선택" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            onClick={handleStart}
            disabled={!appName.trim()}
          >
            시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
