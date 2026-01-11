import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";

export default function DbSettings() {
  const [dbPath, setDbPath] = useState("");

  useEffect(() => {
    invoke<string>("get_db_path").then(setDbPath);
  }, []);

  const handleBackup = async () => {
    const path = await invoke<string>("backup_db");
    alert(`백업 완료! \n${path}`);
  };

  const openDbFolder = async () => {
    try {
      await invoke("open_db_folder");
    } catch (e) {
      console.error("Failed to open db folder", e);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <div className="text-sm text-gray-600 break-all">{dbPath}</div>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(dbPath)}
        >
          경로 복사
        </Button>
        <Button variant="secondary" onClick={handleBackup}>
          DB백업
        </Button>
        <Button variant="outline" onClick={openDbFolder}>
          <FolderOpen className="w-4 h-4 mr-2" />
          DB 폴더 열기
        </Button>
      </Card>
    </div>
  );
}
