import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cloud,
  RotateCw,
  Loader2,
  CloudUpload,
  CloudDownload,
  CloudOff,
  Cloudy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSyncStore } from "@/stores/useSyncStore";
import { Switch } from "@/components/ui/switch";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { cn } from "@/lib/utils";

const SyncSettings = () => {
  const { resetHeader, setHeader } = useHeaderStore();
  const {
    status,
    isLoading,
    autoBackup,
    autoSyncEnabled,
    checkStatus,
    loadSettings,
    toggleAutoBackup,
    toggleAutoSync,
    login,
    logout,
    backup,
    restore,
  } = useSyncStore();
  const { confirm } = useConfirmStore();

  useEffect(() => {
    setHeader("동기화 설정");
    checkStatus();
    loadSettings();
    return () => resetHeader();
  }, [setHeader, resetHeader, checkStatus, loadSettings]);

  if (!status && !isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-[200px] w-full" />
        </Card>
      </div>
    );
  }

  const handleRestore = () => {
    confirm({
      title: "데이터 복구",
      description: (
        <div className="space-y-1">
          <p>OneDrive에서 데이터를 가져와 현재 데이터를 덮어씁니다.</p>
          <p>현재 기기의 변경사항이 사라질 수 있습니다.</p>
          <p className="font-semibold text-rose-500">계속하시겠습니까?</p>
        </div>
      ),
      onConfirm: async () => await restore(),
    });
  };

  return (
    <div className="space-y-6 relative">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl transition-all">
          <div className="flex flex-col items-center gap-4 p-6 bg-card border shadow-xl rounded-xl">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <div className="space-y-1 text-center">
              <h3 className="font-semibold text-lg">데이터 동기화 중</h3>
              <p className="text-sm text-muted-foreground">
                OneDrive와 데이터를 주고받고 있습니다.
                <br />
                잠시만 기다려 주세요...
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloudy className="w-5 h-5 text-blue-500" />
            클라우드 동기화
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 계정 정보 및 연결 상태 박스 */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border transition-colors",
              status?.is_connected
                ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                : "bg-slate-50 border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            )}
          >
            <div className="flex items-start sm:items-center gap-4 mb-4 sm:mb-0">
              <div
                className={cn(
                  "p-3 rounded-xl flex-shrink-0 mt-1 sm:mt-0",
                  status?.is_connected
                    ? "bg-blue-500 text-white dark:bg-blue-900 dark:text-blue-400"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {status?.is_connected ? (
                  <Cloud className="w-6 h-6" />
                ) : (
                  <CloudOff className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 변경된 부분: 항상 Microsoft OneDrive를 제목으로 표시 */}
                  <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Microsoft OneDrive
                  </span>
                  <Badge
                    variant={status?.is_connected ? "default" : "secondary"}
                    className={cn(
                      status?.is_connected &&
                        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    )}
                  >
                    {status?.is_connected ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 연결됨
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> 미연결
                      </span>
                    )}
                  </Badge>
                </div>

                {status?.is_connected ? (
                  <div className="space-y-1">
                    {/* 연결된 계정 정보 표시 */}
                    <div className="text-sm">
                      {status.account_name && (
                        <span className="font-medium text-slate-700 dark:text-slate-300 mr-2">
                          {status.account_name}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {status.account_email}
                      </span>
                    </div>
                    {status.last_synced && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                        <RotateCw className="w-3 h-3" />
                        마지막 동기화:{" "}
                        {new Date(status.last_synced).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    OneDrive에 연결하여 데이터를 안전하게 백업하세요.
                  </div>
                )}
              </div>
            </div>

            <div className="w-full sm:w-auto flex justify-end">
              {!status?.is_connected ? (
                <Button
                  onClick={login}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  OneDrive 연결
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={logout}
                  disabled={isLoading}
                  className="w-full sm:w-auto gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-500 dark:hover:bg-rose-950/50 cursor-pointer"
                >
                  <CloudOff className="w-4 h-4" /> 연결 해제
                </Button>
              )}
            </div>
          </div>

          {/* ... (이하 백업/복구 버튼 및 스위치 영역 동일) ... */}
          {status?.is_connected && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="default"
                  onClick={backup}
                  disabled={isLoading}
                  className="gap-2 flex-1 sm:flex-none bg-slate-600 hover:bg-slate-700 cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" /> 지금 백업하기
                </Button>

                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="gap-2 flex-1 sm:flex-none cursor-pointer"
                  onClick={handleRestore}
                >
                  <CloudDownload className="w-4 h-4" /> 클라우드에서 복구
                </Button>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="auto-sync"
                      className="text-base font-semibold"
                    >
                      앱 시작 시 자동 동기화
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      앱을 켤 때 클라우드에 최신 데이터가 있으면 자동으로
                      가져옵니다.
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSyncEnabled}
                    onCheckedChange={toggleAutoSync}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="auto-backup"
                      className="text-base font-semibold"
                    >
                      앱 종료 시 자동 백업
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      앱을 닫을 때 현재 데이터를 OneDrive에 안전하게 저장합니다.
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={autoBackup}
                    onCheckedChange={toggleAutoBackup}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncSettings;
