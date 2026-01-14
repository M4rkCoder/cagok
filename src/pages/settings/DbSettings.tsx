import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Database, Settings } from "lucide-react";

export default function DbSettings() {
  const [dbPath, setDbPath] = useState("");
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    invoke<string>("get_db_path").then(setDbPath);

    invoke<string | null>("get_setting_command", { key: "app_name" }).then(
      (v) => v && setAppName(v)
    );

    invoke<string | null>("get_setting_command", { key: "language" }).then(
      (v) => v && setLanguage(v)
    );
  }, []);

  const handleBackup = async () => {
    const path = await invoke<string>("backup_db");
    alert(`백업 완료!\n${path}`);
  };

  const openDbFolder = async () => {
    try {
      await invoke("open_db_folder");
    } catch (e) {
      console.error("Failed to open db folder", e);
    }
  };

  const languageLabel =
    language === "ko" ? "한국어" : language === "en" ? "English" : language;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* 앱 기본 정보 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="w-5 h-5" />앱 기본 정보
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">가계부 이름</div>
            <div className="font-medium">{appName || "-"}</div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1">기본 언어</div>
            <div className="font-medium">{languageLabel || "-"}</div>
          </div>
        </div>
      </Card>

      {/* DB 정보 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Database className="w-5 h-5" />
          데이터베이스
        </div>

        <div className="text-sm text-muted-foreground break-all">
          {dbPath}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(dbPath)}
            >
              경로 복사
            </Button>

            <Button variant="outline" onClick={openDbFolder}>
              <FolderOpen className="w-4 h-4 mr-2" />
              DB 폴더 열기
            </Button>
          </div>
        </div>
        <div className="text-lg font-semibold">백업</div>

        <Button variant="secondary" onClick={handleBackup}>
          DB 백업 생성
        </Button>
      </Card>
    </div>
  );
}
