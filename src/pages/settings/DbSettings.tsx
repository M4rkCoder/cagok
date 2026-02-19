import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  FolderOpen,
  Database,
  History,
  Download,
  Copy,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Save,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useHeaderStore } from "@/store/useHeaderStore";

export default function DbSettings() {
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);

  const [dbPath, setDbPath] = useState("");
  const [exportPath, setExportPath] = useState("");
  const [backups, setBackups] = useState<string[]>([]);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastAutoBackupDate, setLastAutoBackupDate] = useState<string | null>(
    null
  );

  useEffect(() => {
    setHeader("데이터베이스 설정");
    invoke<string>("get_db_path").then(setDbPath);
    invoke<string>("get_export_path").then(setExportPath);
    fetchBackups();
    fetchAutoBackupSettings();
    return () => resetHeader();
  }, []);

  const fetchAutoBackupSettings = async () => {
    try {
      const enabled = await invoke<string | null>("get_setting_command", {
        key: "auto_backup_enabled",
      });
      setAutoBackupEnabled(enabled === "true");

      const lastDate = await invoke<string | null>("get_setting_command", {
        key: "last_auto_backup_date",
      });
      setLastAutoBackupDate(lastDate);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  const handleAutoBackupToggle = async (checked: boolean) => {
    setAutoBackupEnabled(checked);
    try {
      await invoke("set_setting_command", {
        key: "auto_backup_enabled",
        value: checked ? "true" : "false",
      });
      if (checked) {
        toast.success("자동 백업이 활성화되었습니다.");
      } else {
        toast.info("자동 백업이 비활성화되었습니다.");
      }
    } catch (e) {
      toast.error("설정 저장 실패");
      setAutoBackupEnabled(!checked); // revert
    }
  };

  const fetchBackups = async () => {
    try {
      const backupFiles = await invoke<string[]>("list_backups");
      setBackups(backupFiles);
    } catch (e) {
      toast.error("백업 목록을 불러오지 못했습니다.");
    }
  };

  const handleBackup = async () => {
    try {
      await invoke("backup_db");
      toast.success("백업이 성공적으로 생성되었습니다.");
      fetchBackups();
    } catch (e) {
      toast.error(`백업 실패: ${e}`);
    }
  };

  const parseBackupName = (name: string) => {
    const match = name.match(/(\d{8})_(\d{6})/);
    if (!match) return name;
    return `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)} ${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}`;
  };

  const sortedBackups = [...backups].sort((a, b) => {
    if (a === "cagok_auto.db") return -1;
    if (b === "cagok_auto.db") return 1;
    return b.localeCompare(a); // 최신 날짜순
  });

  const renderBackupTime = (backup: string) => {
    if (backup === "cagok_auto.db") {
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">[자동 백업]</span>
          <span className="text-muted-foreground">
            {lastAutoBackupDate || "기록 없음"}
          </span>
        </div>
      );
    }
    return parseBackupName(backup);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* 1. 스토리지 경로 정보 카드 */}
      <Card className="overflow-hidden border-none shadow-sm bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              데이터베이스 관리
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* DB 위치 섹션 (Full Width) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-primary" />
              <label className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                데이터베이스 경로
              </label>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-background border shadow-sm group transition-all hover:border-primary/30">
              <span className="text-sm font-mono text-muted-foreground pl-2 flex-1 truncate">
                {dbPath}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={() => invoke("open_db_folder")}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-[11px] font-medium">폴더 열기</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(dbPath);
                    toast.success("경로가 복사되었습니다.");
                  }}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-[11px] font-medium">경로 복사</span>
                </Button>
              </div>
            </div>
          </div>

          {/* CSV 위치 섹션 (Full Width) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <label className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                데이터베이스 다운로드
              </label>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-background border shadow-sm group transition-all hover:border-primary/30">
              <span className="text-sm font-mono text-muted-foreground pl-2 flex-1 truncate">
                {exportPath}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={() => invoke("open_export_folder")}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-[11px] font-medium">폴더 열기</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={async () => {
                    try {
                      await invoke("export_transactions_csv");
                      toast.success("CSV 추출 완료");
                      await invoke("open_export_folder");
                    } catch (e) {
                      toast.error("실패");
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[11px] font-medium uppercase tracking-tighter">
                    다운로드
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 통합된 백업 관리 카드 */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              데이터베이스 백업
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => invoke("open_backup_folder")}
            >
              <FolderOpen className="w-4 h-4" />
              백업 폴더
            </Button>
            <Button size="sm" onClick={handleBackup} className="h-8 shadow-sm">
              <ShieldCheck className="w-4 h-4 mr-2" />
              지금 백업
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 자동 백업 설정 영역 (카드 상단에 배치) */}
          <div
            onClick={() => handleAutoBackupToggle(!autoBackupEnabled)}
            className={`
    flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none
    ${
      autoBackupEnabled
        ? "border-primary bg-primary/[0.08] shadow-[0_0_15px_-5px_rgba(var(--primary),0.1)]"
        : "border-muted bg-muted/10 hover:bg-muted/20"
    }
  `}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label
                  className={`font-bold text-sm transition-colors ${autoBackupEnabled ? "text-primary" : "text-foreground"}`}
                >
                  종료 시 자동 백업 활성화
                </label>
                {autoBackupEnabled && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p
                className={`text-xs transition-colors ${autoBackupEnabled ? "text-primary/80" : "text-muted-foreground"}`}
              >
                앱을 닫을 때 'cagok_auto.db' 파일로 자동 저장합니다.
              </p>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {/* 스위치 자체 클릭 시 이벤트 버블링 방지 */}
              <Switch
                id="auto-backup"
                checked={autoBackupEnabled}
                onCheckedChange={handleAutoBackupToggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* 백업 목록 테이블 */}
          <div className="space-y-3">
            <div className="rounded-xl border border-muted bg-background overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="py-3 text-[11px] font-bold pl-6">
                      백업 시점
                    </TableHead>
                    <TableHead className="text-right py-3 text-[11px] font-bold pr-6">
                      관리
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBackups.length > 0 ? (
                    sortedBackups.map((backup) => (
                      <TableRow
                        key={backup}
                        className={`group transition-colors ${backup === "cagok_auto.db" ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/5"}`}
                      >
                        <TableCell className="py-3 pl-6 font-medium text-sm text-muted-foreground group-hover:text-foreground">
                          {renderBackupTime(backup)}
                        </TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreConfirmOpen(true);
                              }}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              복원
                            </Button>
                            {/* 자동 백업 파일은 삭제 버튼을 숨기거나 비활성화 (권장) */}
                            {backup !== "cagok_auto.db" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        보관된 백업 기록이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialogs (기존 로직과 동일) */}
      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title="데이터 복원"
        description={
          selectedBackup && (
            <div className="space-y-2 py-2">
              <p className="text-sm">
                선택한 시점으로 데이터를 되돌립니다.{" "}
                <span className="underline decoration-destructive underline-offset-4">
                  현재 데이터는 모두 삭제됩니다.
                </span>
              </p>
              <p className="text-xs font-mono bg-muted p-2 rounded text-center">
                {parseBackupName(selectedBackup)}
              </p>
            </div>
          )
        }
        confirmText="복원 진행"
        onConfirm={async () => {
          if (!selectedBackup) return;
          try {
            await invoke("restore_backup", { filename: selectedBackup });
            setRestoreConfirmOpen(false);
            setRestoreDialogOpen(true);
          } catch (e) {
            toast.error("복원 실패");
          }
        }}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="복원 완료"
        description="성공적으로 복원되었습니다. 적용을 위해 앱을 다시 시작합니다."
        confirmText="앱 재시작"
        onConfirm={() => invoke("restart_app")}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="기록 삭제"
        description="백업 파일을 삭제하시겠습니까? 삭제된 데이터는 다시 찾을 수 없습니다."
        confirmText="삭제"
        onConfirm={async () => {
          if (!selectedBackup) return;
          try {
            await invoke("delete_backup", { filename: selectedBackup });
            toast.success("백업 삭제 완료");
            setDeleteConfirmOpen(false);
            fetchBackups();
          } catch (e) {
            toast.error("삭제 실패");
          }
        }}
      />
    </div>
  );
}
