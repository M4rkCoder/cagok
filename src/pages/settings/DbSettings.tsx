import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Database, Settings, History } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DbSettings() {
  const [dbPath, setDbPath] = useState("");
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("");
  const [backups, setBackups] = useState<string[]>([]);

  const fetchBackups = async () => {
    try {
      const backupFiles = await invoke<string[]>("list_backups");
      setBackups(backupFiles);
    } catch (e) {
      console.error("Failed to fetch backups", e);
      toast.error("백업 목록을 불러오는 데 실패했습니다.");
    }
  };

  useEffect(() => {
    invoke<string>("get_db_path").then(setDbPath);

    invoke<string | null>("get_setting_command", { key: "app_name" }).then(
      (v) => setAppName(v || "Finkro")
    );

    invoke<string | null>("get_setting_command", { key: "language" }).then(
      (v) => setLanguage(v || "ko")
    );

    fetchBackups();
  }, []);

  const handleBackup = async () => {
    try {
      const path = await invoke<string>("backup_db");
      toast.success(`백업 완료!\n${path}`);
      fetchBackups(); // Refresh backup list
    } catch (e) {
      toast.error(`백업 실패: ${e}`);
    }
  };

  const handleRestore = async (filename: string) => {
    if (
      !window.confirm(
        `'${filename}' 백업으로 복원하시겠습니까? 현재 데이터는 덮어씌워집니다.`
      )
    ) {
      return;
    }
    try {
      await invoke("restore_backup", { filename });
      toast.success(
        "복원이 완료되었습니다. 앱을 다시 시작하여 변경사항을 확인하세요."
      );
    } catch (e) {
      toast.error(`복원 실패: ${e}`);
    }
  };

  const openDbFolder = async () => {
    try {
      await invoke("open_db_folder");
    } catch (e) {
      console.error("Failed to open db folder", e);
    }
  };

  const handleSaveSettings = async () => {
    await invoke("set_setting_command", { key: "app_name", value: appName });
    await invoke("set_setting_command", { key: "language", value: language });
    toast.success("설정이 저장되었습니다.");
    invoke<string | null>("get_setting_command", { key: "app_name" }).then(
      (v) => setAppName(v || "Finkro")
    );
    invoke<string | null>("get_setting_command", { key: "language" }).then(
      (v) => setLanguage(v || "ko")
    );
  };

  const parseBackupName = (name: string) => {
    const match = name.match(/(\d{8})_(\d{6})/);
    if (!match) return name;
    const date = `${match[1].slice(0, 4)}-${match[1].slice(
      4,
      6
    )}-${match[1].slice(6, 8)}`;
    const time = `${match[2].slice(0, 2)}:${match[2].slice(
      2,
      4
    )}:${match[2].slice(4, 6)}`;
    return `${date} ${time}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* 앱 기본 정보 */}
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

      {/* DB 정보 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Database className="w-5 h-5" />
          데이터베이스
        </div>
        <div className="text-sm text-muted-foreground break-all">
          {dbPath}
          <div className="flex flex-wrap gap-2 mt-2">
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

      {/* 백업 관리 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <History className="w-5 h-5" />
          백업 관리
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>백업 일시</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.length > 0 ? (
              backups.map((backup) => (
                <TableRow key={backup}>
                  <TableCell>{parseBackupName(backup)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(backup)}
                    >
                      복원
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  백업 파일이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
