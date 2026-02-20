import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Cloud,
  RotateCw,
  Upload,
  Download,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  CloudUpload,
  CloudDownload,
  CloudBackup,
  CloudOff,
  Cloudy,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useHeaderStore } from "@/store/useHeaderStore";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSyncStore } from "@/store/useSyncStore";

import { Switch } from "@/components/ui/switch";
import { useConfirmStore } from "@/store/useConfirmStore";

const SyncSettings = () => {
  const { resetHeader, setHeader } = useHeaderStore();
  const {
    status,
    isLoading,
    autoBackup,
    checkStatus,
    loadSettings,
    toggleAutoBackup,
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
  }, []);

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
          <p className="font-semibold">계속하시겠습니까?</p>
        </div>
      ),
      onConfirm: async () => await restore(),
    });
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg transition-all">
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
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Cloudy className="w-6 h-6 text-blue-500" /> Microsoft OneDrive
            </div>
            {status?.is_connected && status.account_email && (
              <div className="text-xs text-muted-foreground px-1">
                {status.account_email}
              </div>
            )}
          </div>
          <Badge variant={status?.is_connected ? "default" : "secondary"}>
            {status?.is_connected ? "연결됨" : "연결되지 않음"}
          </Badge>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <Label className="text-base">연결 상태</Label>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {status?.is_connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>
                    <strong>{status.account_name || "사용자"}</strong> 님의
                    OneDrive 계정에 연결되어 있습니다.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-gray-400" />
                  OneDrive에 연결하여 데이터를 백업하고 동기화하세요.
                </>
              )}
            </div>
            {status?.last_synced && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                마지막 동기화: {new Date(status.last_synced).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {!status?.is_connected ? (
              <Button
                onClick={login}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "연결 중..." : "OneDrive 연결"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={backup}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <CloudUpload className="w-4 h-4" /> 지금 백업
                </Button>

                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="gap-2"
                  onClick={handleRestore}
                >
                  <CloudDownload className="w-4 h-4" /> 복구 (동기화)
                </Button>

                <Button
                  variant="outline"
                  onClick={logout}
                  disabled={isLoading}
                  className="gap-2 border-rose-200 text-rose-500 hover:bg-rose-200 hover:text-rose-500"
                >
                  <CloudOff className="w-4 h-4" /> 연결 해제
                </Button>
              </>
            )}
          </div>

          {status?.is_connected && (
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="auto-backup"
                checked={autoBackup}
                onCheckedChange={toggleAutoBackup}
              />
              <Label htmlFor="auto-backup">앱 종료 시 자동 백업</Label>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SyncSettings;
