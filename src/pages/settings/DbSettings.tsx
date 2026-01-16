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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CsvImportCard } from "./CsvImportCard";

export default function DbSettings() {
  const [dbPath, setDbPath] = useState("");
  const [exportPath, setExportPath] = useState("");
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("");
  const [backups, setBackups] = useState<string[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

    invoke<string>("get_export_path").then(setExportPath);

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
    setSelectedBackup(filename);
    setRestoreConfirmOpen(true);
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
        <br />
        csv저장위치: {exportPath}
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const path = await invoke("export_transactions_csv");
              toast.success(`다운로드 완료!\n${path}`);
              await invoke("open_export_folder");
            } catch (e) {
              toast.error(`다운로드 실패: ${e}`);
            }
          }}
        >
          csv 다운로드
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await invoke("open_export_folder");
          }}
        >
          다운로드 폴더 열기
        </Button>
      </Card>
      <CsvImportCard />
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      삭제
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
      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title="백업 복원"
        description={
          selectedBackup && (
            <>
              <p>
                '{parseBackupName(selectedBackup)}' 백업으로 복원하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                현재 데이터는 덮어씌워집니다.
              </p>
            </>
          )
        }
        confirmText="복원"
        cancelText="취소"
        onConfirm={async () => {
          if (!selectedBackup) return;

          try {
            await invoke("restore_backup", { filename: selectedBackup });
            setRestoreConfirmOpen(false);
            setRestoreDialogOpen(true);
          } catch (e) {
            toast.error(`복원 실패: ${e}`);
          }
        }}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="복원 완료"
        description={
          <>
            <p>"변경 사항을 적용하려면 앱을 다시 시작해야 합니다.</p>
            <p>지금 재시작 하시겠습니까?"</p>
          </>
        }
        confirmText="재시작"
        cancelText="나중에"
        onConfirm={async () => {
          await invoke("restart_app");
        }}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="백업 삭제"
        description={
          selectedBackup && (
            <>
              <p>
                '{parseBackupName(selectedBackup)}' 백업을 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-destructive">
                삭제된 백업은 복구할 수 없습니다.
              </p>
            </>
          )
        }
        confirmText="삭제"
        cancelText="취소"
        onConfirm={async () => {
          if (!selectedBackup) return;
          try {
            await invoke("delete_backup", { filename: selectedBackup });
            toast.success("백업이 삭제되었습니다.");
            setDeleteConfirmOpen(false);
            setSelectedBackup(null);
            fetchBackups(); // ⭐ 즉시 UI 갱신
          } catch (e) {
            toast.error(`삭제 실패: ${e}`);
          }
        }}
      />
    </div>
  );
}
