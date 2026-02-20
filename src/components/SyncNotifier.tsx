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
import { useSyncStore } from "@/store/useSyncStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProIcon } from "./ui/PlusBadge";

export const SyncNotifier = () => {
  const {
    status,
    isLoading,
    autoBackup,
    login,
    logout,
    backup,
    restore,
    toggleAutoBackup,
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
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-4 mr-2 shadow-2xl border-border"
        align="end"
      >
        <div className="space-y-4">
          {/* 헤더 섹션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <ProIcon />
              클라우드 동기화
            </div>
            <Badge
              variant={status?.is_connected ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {status?.is_connected ? "연결됨" : "미연결"}
            </Badge>
          </div>
          {status?.is_connected ? (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2 border border-blue-100/20">
              {/* 제목행: 서비스 이름 */}
              <div className="flex items-center gap-2 pb-1 border-b border-muted">
                <Cloudy size={16} className="text-blue-500" />
                <span className="text-sm font-bold tracking-tight text-foreground/80">
                  Microsoft OneDrive
                </span>
              </div>

              {/* 정보행: 이름 및 이메일 */}
              <div className="space-y-0.5 px-0.5">
                <div className="text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {status.account_name}
                  <div className="text-xs text-muted-foreground truncate leading-relaxed">
                    {status.account_email}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2 py-3 px-1">
              <XCircle className="w-4 h-4" />
              연결된 계정이 없습니다.
            </div>
          )}
          <Separator />
          {/* 액션 버튼 섹션 */}
          <div className="grid grid-cols-1 gap-2">
            {!status?.is_connected ? (
              <Button
                size="sm"
                onClick={login}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
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
                    className="text-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CloudUpload className="mr-1 h-3 w-3" />
                    )}
                    백업
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CloudDownload className="mr-1 h-3 w-3" />
                    )}
                    복구
                  </Button>
                </div>

                <div className="flex items-center justify-between py-1 px-1">
                  <Label
                    htmlFor="popover-auto-backup"
                    className="text-[11px] cursor-pointer"
                  >
                    앱 종료 시 자동 백업
                  </Label>
                  <Switch
                    id="popover-auto-backup"
                    checked={autoBackup}
                    onCheckedChange={toggleAutoBackup}
                    className="scale-75"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  disabled={isLoading}
                  className="w-full text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-8"
                >
                  <CloudOff className="mr-2 h-3 w-3" /> 연결 해제
                </Button>
              </>
            )}
          </div>
          {/* 하단 상태 정보 */}
          {status?.last_synced && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center pt-1">
              <RotateCw className="w-2.5 h-2.5" />
              마지막 동기화: {new Date(status.last_synced).toLocaleTimeString()}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
