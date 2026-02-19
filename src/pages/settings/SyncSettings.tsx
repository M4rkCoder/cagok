import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cloud, RotateCw, Upload, Download, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useHeaderStore } from "@/store/useHeaderStore";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { Switch } from "@/components/ui/switch";

interface OneDriveStatus {
  is_connected: boolean;
  last_synced: string | null;
  account_name: string | null;
}

const SyncSettings = () => {
  const { resetHeader, setHeader } = useHeaderStore();
  const [status, setStatus] = useState<OneDriveStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    setHeader("동기화 설정");
    checkStatus();
    loadSettings();
    return () => resetHeader();
  }, []);

  const loadSettings = async () => {
      try {
          const val = await invoke<string | null>("get_setting_command", { key: "auto_onedrive_backup" });
          setAutoBackup(val === "true");
      } catch (e) {
          console.error(e);
      }
  };

  const handleAutoBackupChange = async (checked: boolean) => {
      setAutoBackup(checked);
      try {
          await invoke("set_setting_command", { key: "auto_onedrive_backup", value: checked ? "true" : "false" });
          toast.success("설정이 저장되었습니다.");
      } catch (e) {
          console.error(e);
          toast.error("설정 저장 실패");
          setAutoBackup(!checked); // Revert
      }
  };

  const checkStatus = async () => {
    try {
      const result = await invoke<OneDriveStatus>("onedrive_check_status");
      setStatus(result);
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await invoke("onedrive_login");
      toast.success("OneDrive에 연결되었습니다.");
      await checkStatus();
    } catch (error) {
      console.error(error);
      toast.error("로그인 실패: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await invoke("onedrive_logout");
      toast.success("연결이 해제되었습니다.");
      await checkStatus();
    } catch (error) {
      console.error(error);
      toast.error("로그아웃 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      await invoke("onedrive_backup");
      toast.success("백업이 완료되었습니다.");
      await checkStatus();
    } catch (error) {
      console.error(error);
      toast.error("백업 실패: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await invoke("onedrive_restore");
      toast.success("복구가 완료되었습니다.");
      // Maybe force reload or re-fetch data?
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast.error("복구 실패: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!status && !isLoading) {
      return (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
                <Skeleton className="h-[200px] w-full" />
            </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Cloud className="w-6 h-6 text-blue-500" /> Microsoft OneDrive
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
                  현재 OneDrive 계정에 연결되어 있습니다.
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-gray-400" />
                  OneDrive에 연결하여 데이터를 백업하고 동기화하세요.
                </>
              )}
            </div>
            {status?.last_synced && (
               <div className="text-xs text-muted-foreground mt-1">
                   마지막 동기화: {new Date(status.last_synced).toLocaleString()}
               </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {!status?.is_connected ? (
              <Button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "연결 중..." : "OneDrive 연결"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleBackup} disabled={isLoading} className="gap-2">
                  <Upload className="w-4 h-4" /> 지금 백업
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isLoading} className="gap-2">
                      <Download className="w-4 h-4" /> 복구 (동기화)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>데이터 복구</AlertDialogTitle>
                      <AlertDialogDescription>
                        OneDrive에서 데이터를 가져와 현재 데이터를 덮어씁니다.
                        현재 기기의 변경사항이 사라질 수 있습니다. 계속하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestore}>복구 진행</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="destructive" onClick={handleLogout} disabled={isLoading} className="gap-2">
                  <LogOut className="w-4 h-4" /> 연결 해제
                </Button>
              </>
            )}
          </div>
          
           {status?.is_connected && (
              <div className="flex items-center space-x-2 pt-4 border-t">
                  <Switch id="auto-backup" checked={autoBackup} onCheckedChange={handleAutoBackupChange} />
                  <Label htmlFor="auto-backup">앱 종료 시 자동 백업</Label>
              </div>
           )}

        </div>
      </Card>
      
      <Card className="p-6">

          <div className="space-y-4">
              <h3 className="font-semibold text-lg">자동 동기화 안내</h3>
              <p className="text-sm text-muted-foreground">
                  앱을 종료할 때 자동으로 백업하고, 앱을 시작할 때 최신 데이터가 있는지 확인합니다.
                  (현재 수동 동기화만 지원됩니다. 자동 기능은 추후 업데이트 예정)
              </p>
          </div>
      </Card>
    </div>
  );
};

export default SyncSettings;
