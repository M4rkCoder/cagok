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
import { ProIcon } from "./ui/PlusBadge";
import { cn } from "@/lib/utils";

export const SyncNotifier = () => {
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
      title: "데이터 복구",
      description: (
        <div className="space-y-1">
          <p>OneDrive에서 데이터를 가져와 현재 데이터를 덮어씁니다.</p>
          <p>현재 기기의 변경사항이 사라질 수 있습니다.</p>
          <p className="font-semibold">계속하시겠습니까?</p>
        </div>
      ),
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
        className="w-80 p-0 mr-2 shadow-2xl border-border overflow-hidden rounded-xl"
        align="end"
      >
        {/* 헤더 섹션 */}
        <div className="bg-slate-50 border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <ProIcon />
            클라우드 동기화
          </div>
          <Badge
            variant={status?.is_connected ? "default" : "secondary"}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              status?.is_connected
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-slate-200 text-slate-500",
            )}
          >
            {status?.is_connected ? "연결됨" : "미연결"}
          </Badge>
        </div>

        <div className="p-4 space-y-4">
          {status?.is_connected ? (
            <div className="bg-blue-50/50 p-4 rounded-xl space-y-3 border border-blue-100 shadow-inner">
              <div className="flex items-center gap-2.5 pb-2 border-b border-blue-100/50">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                  <Cloud size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-blue-900 leading-none mb-1">
                    OneDrive
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Authenticated
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 px-0.5 overflow-hidden">
                <div className="text-[13px] font-bold text-slate-700 truncate">
                  {status.account_name}
                </div>
                <div className="text-[11px] text-slate-400 truncate font-medium">
                  {status.account_email}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 font-medium flex flex-col items-center justify-center gap-2 py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CloudOff className="w-8 h-8 opacity-20" />
              연결된 계정이 없습니다.
            </div>
          )}

          {/* 액션 버튼 섹션 */}
          <div className="grid grid-cols-1 gap-3">
            {!status?.is_connected ? (
              <Button
                size="lg"
                onClick={login}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-100"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Cloudy className="mr-2 h-4 w-4" />
                )}
                OneDrive 로그인
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={backup}
                    disabled={isLoading}
                    className="text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-blue-500" />
                    ) : (
                      <CloudUpload className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                    )}
                    즉시 백업
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-amber-600 hover:border-amber-200 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-amber-500" />
                    ) : (
                      <CloudDownload className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    )}
                    데이터 복구
                  </Button>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label
                        htmlFor="popover-auto-sync"
                        className="text-[11px] font-bold text-slate-700 cursor-pointer mb-0.5"
                      >
                        실행 시 자동 동기화
                      </Label>
                      <span className="text-[9px] text-slate-400">
                        앱 시작 시 클라우드 데이터와 병합
                      </span>
                    </div>
                    <Switch
                      id="popover-auto-sync"
                      checked={autoSyncEnabled}
                      onCheckedChange={toggleAutoSync}
                      className="scale-75 data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <Separator className="bg-slate-200/50" />

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label
                        htmlFor="popover-auto-backup"
                        className="text-[11px] font-bold text-slate-700 cursor-pointer mb-0.5"
                      >
                        앱 종료 시 자동 백업
                      </Label>
                      <span className="text-[9px] text-slate-400">
                        데이터 변경 시 클라우드에 자동 업로드
                      </span>
                    </div>
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
                  className="w-full text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors h-9"
                >
                  <CloudOff className="mr-2 h-3.5 w-3.5" /> 연결 해제
                </Button>
              </>
            )}
          </div>
          {/* 하단 상태 정보 */}
          {status?.last_synced && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center pt-1 font-medium bg-slate-50 py-2 rounded-lg">
              <RotateCw className="w-3 h-3 text-slate-300" />
              <span>
                마지막 동기화: {new Date(status.last_synced).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
