import { useEffect, useState } from "react";
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
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { useTranslation } from "react-i18next";

export default function DbSettings() {
  const { t } = useTranslation();
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);

  const {
    dbPath,
    exportPath,
    backups,
    autoBackupEnabled,
    lastAutoBackupDate,
    fetchDbPaths,
    fetchBackups,
    fetchAutoBackupSettings,
    toggleAutoBackup,
    createBackup,
    restoreBackup,
    deleteBackup,
    openFolder,
    exportCsv,
    restartApp,
  } = useSettingStore();

  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setHeader(t("settings.database.title"));
    fetchDbPaths();
    fetchBackups();
    fetchAutoBackupSettings();
    return () => resetHeader();
  }, []);

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
          <span className="font-bold text-primary">{t("settings.database.auto_backup_tag")}</span>
          <span className="text-muted-foreground">
            {lastAutoBackupDate || t("settings.database.no_record")}
          </span>
        </div>
      );
    }
    return parseBackupName(backup);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* 1. 스토리지 경로 정보 카드 */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              {t("settings.database.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* DB 위치 섹션 (Full Width) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-primary" />
              <label className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                {t("settings.database.path_label")}
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
                  onClick={() => openFolder("db")}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-[11px] font-medium">{t("settings.database.open_folder")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(dbPath);
                    toast.success(t("settings.database.path_copied"));
                  }}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-[11px] font-medium">{t("settings.database.copy_path")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* CSV 위치 섹션 (Full Width) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <label className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                {t("settings.database.download_title")}
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
                  onClick={() => openFolder("export")}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-[11px] font-medium">{t("settings.database.open_folder")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 hover:bg-muted text-muted-foreground flex gap-2"
                  onClick={exportCsv}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[11px] font-medium uppercase tracking-tighter">
                    {t("settings.database.download_button")}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 통합된 백업 관리 카드 */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              {t("settings.database.backup_title")}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => openFolder("backup")}
            >
              <FolderOpen className="w-4 h-4" />
              {t("settings.database.backup_folder")}
            </Button>
            <Button size="sm" onClick={createBackup} className="h-8 shadow-sm">
              <ShieldCheck className="w-4 h-4 mr-2" />
              {t("settings.database.backup_now")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 자동 백업 설정 영역 (카드 상단에 배치) */}
          <div
            onClick={() => toggleAutoBackup(!autoBackupEnabled)}
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
                  {t("settings.database.auto_backup_label")}
                </label>
                {autoBackupEnabled && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p
                className={`text-xs transition-colors ${autoBackupEnabled ? "text-primary/80" : "text-muted-foreground"}`}
              >
                {t("settings.database.auto_backup_desc")}
              </p>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {/* 스위치 자체 클릭 시 이벤트 버블링 방지 */}
              <Switch
                id="auto-backup"
                checked={autoBackupEnabled}
                onCheckedChange={toggleAutoBackup}
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
                      {t("settings.database.backup_time_header")}
                    </TableHead>
                    <TableHead className="text-right py-3 text-[11px] font-bold pr-6">
                      {t("settings.database.manage_header")}
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
                              {t("settings.database.restore")}
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
                        {t("settings.database.no_backups")}
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
        title={t("settings.database.restore_dialog_title")}
        description={
          selectedBackup && (
            <div className="space-y-2 py-2">
              <p className="text-sm">
                {t("settings.database.restore_dialog_desc")}
              </p>
              <p className="text-xs font-mono bg-muted p-2 rounded text-center">
                {parseBackupName(selectedBackup)}
              </p>
            </div>
          )
        }
        confirmText={t("settings.database.restore_confirm")}
        onConfirm={async () => {
          if (!selectedBackup) return;
          try {
            await restoreBackup(selectedBackup);
            setRestoreConfirmOpen(false);
            setRestoreDialogOpen(true);
          } catch (e) {
            // Toast handled in store
          }
        }}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title={t("settings.database.restore_complete_title")}
        description={t("settings.database.restore_complete_desc")}
        confirmText={t("settings.database.restart_button")}
        onConfirm={restartApp}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("settings.database.delete_backup_title")}
        description={t("settings.database.delete_backup_desc")}
        confirmText={t("common.delete")}
        onConfirm={async () => {
          if (!selectedBackup) return;
          try {
            await deleteBackup(selectedBackup);
            setDeleteConfirmOpen(false);
          } catch (e) {
            // Toast handled in store
          }
        }}
      />
    </div>
  );
}
