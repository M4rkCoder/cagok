import {
  Cloudy,
  CloudUpload,
  CloudDownload,
  CloudOff,
  RotateCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSyncStore } from "@/stores/useSyncStore";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const SyncNotifier = () => {
  const { t } = useTranslation();
  const {
    status,
    isLoading,
    autoBackup,
    autoSyncEnabled,
    login,
    logout,
    backup,
    restore,
    toggleAutoBackup,
    toggleAutoSync,
  } = useSyncStore();
  const { confirm } = useConfirmStore();

  const handleRestore = () => {
    confirm({
      title: t("settings.sync.restore_confirm_title"),
      description: t("settings.sync.restore_confirm_desc"),
      onConfirm: async () => await restore(),
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 text-slate-200 hover:text-amber-600 transition-colors focus:outline-none group">
          {status?.is_connected ? (
            <Cloudy
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
          ) : (
            <CloudOff
              size={20}
              className="group-hover:scale-110 transition-transform text-muted-foreground"
            />
          )}

          {/* 연결 상태 알림 점 */}
          {status?.is_connected && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 mr-2 shadow-2xl border-zinc-200 overflow-hidden rounded-xl z-[9999]"
        align="end"
        sideOffset={6}
      >
        {/* 헤더 섹션 - NotificationBell과 일관되게 */}
        <div className="bg-zinc-50/50 border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-zinc-700">
            <Cloudy size={18} />
            {t("settings.sync.title")}
          </div>
          <Badge
            variant={status?.is_connected ? "default" : "secondary"}
            className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full gap-1 justify-center items-center border-none",
              status?.is_connected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-200 text-zinc-500"
            )}
          >
            {status?.is_connected ? (
              <>
                <CheckCircle2 size={10} /> {t("settings.sync.connected").toUpperCase()}
              </>
            ) : (
              <>
                <XCircle size={10} /> {t("settings.sync.disconnected").toUpperCase()}
              </>
            )}
          </Badge>
        </div>

        <div className="p-4 space-y-4">
          {status?.is_connected ? (
            <div className="bg-blue-50/30 p-4 rounded-xl space-y-3 border border-blue-100/50 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md">
                  <Cloud size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-blue-900 leading-none mb-1.5">
                    OneDrive
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-blue-600/80 uppercase tracking-wider truncate">
                      {status.account_name}
                    </span>
                    <div className="text-[10px] text-zinc-400 truncate font-medium">
                      {status.account_email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 font-bold flex flex-col items-center justify-center gap-3 py-8 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
              <CloudOff size={32} className="opacity-20" />
              {t("sync_notifier.no_account")}
            </div>
          )}

          {/* 액션 버튼 섹션 */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            {!status?.is_connected ? (
              <Button
                size="lg"
                onClick={login}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 font-black text-sm h-11 rounded-xl shadow-lg shadow-blue-100"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Cloudy className="mr-2 h-4 w-4" />
                )}
                {t("sync_notifier.login_button")}
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={backup}
                    disabled={isLoading}
                    className="text-[11px] font-black bg-zinc-800 hover:bg-black text-white hover:text-white border-none transition-all cursor-pointer h-9 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {t("sync_notifier.backup_now")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="text-[11px] font-black border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer h-9 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudDownload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {t("sync_notifier.restore_data")}
                  </Button>
                </div>

                <div className="bg-zinc-50/80 rounded-xl p-3.5 space-y-2 border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="popover-auto-sync"
                      className="text-[11px] font-black text-zinc-600 cursor-pointer uppercase tracking-tight"
                    >
                      {t("settings.sync.auto_sync_start")}
                    </Label>
                    <Switch
                      id="popover-auto-sync"
                      checked={autoSyncEnabled}
                      onCheckedChange={toggleAutoSync}
                      className="scale-75 data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <Separator className="bg-zinc-200/50" />

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="popover-auto-backup"
                      className="text-[11px] font-black text-zinc-600 cursor-pointer uppercase tracking-tight"
                    >
                      {t("settings.sync.auto_backup_end")}
                    </Label>
                    <Switch
                      id="popover-auto-backup"
                      checked={autoBackup}
                      onCheckedChange={toggleAutoBackup}
                      className="scale-75 data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  disabled={isLoading}
                  className="w-full text-[11px] font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors h-8 cursor-pointer"
                >
                  <CloudOff className="mr-2 h-3.5 w-3.5" /> {t("settings.sync.logout_button")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 하단 상태 정보 - NotificationBell의 하단 버튼 영역과 유사하게 */}
        {status?.last_synced && (
          <div className="px-4 py-2 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-center">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              <RotateCw className="w-2.5 h-2.5" />
              <span>
                {t("settings.sync.last_sync")}: {new Date(status.last_synced).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
