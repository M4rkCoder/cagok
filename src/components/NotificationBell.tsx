import { useState } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { Bell, CheckCircle2, Trash2, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export const NotificationBell = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [open, setOpen] = useState(false);

  const handleLinkClick = (id: string) => {
    markAsRead(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 text-slate-200 hover:text-amber-600 transition-colors focus:outline-none group">
          <Bell
            size={20}
            className="group-hover:scale-110 transition-transform"
          />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full font-bold border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* 화이트 테마 적용 및 크기 축소 (w-72, z-[9999]) */}
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-0 bg-white border-zinc-200 shadow-lg z-[9999] rounded-xl overflow-hidden"
      >
        {/* 헤더 부분 여백 축소 */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50/50">
          <h4 className="font-bold text-xs text-zinc-800 flex items-center gap-1.5">
            알림{" "}
            <span className="text-amber-600 font-medium">{unreadCount}</span>
          </h4>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-amber-600 hover:bg-white"
              onClick={() => markAllAsRead()}
            >
              <CheckCircle2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-white"
              onClick={() => clearAll()}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        <Separator className="bg-zinc-100" />

        {/* 높이 축소 (h-[300px]) */}
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-zinc-400 gap-1.5">
              <Info size={24} className="opacity-30" />
              <p className="text-xs">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                // 링크 생성 로직: 명시적 링크 -> 타입 기반 -> 메시지 키워드 기반 -> 기본값
                let linkTarget = n.link;
                if (!linkTarget) {
                  if (n.type === "recurring")
                    linkTarget = "/transactions/recurring";
                  else if (n.type === "backup") linkTarget = "/settings/db";
                  // 레거시 지원: 메시지 내용으로 추론
                  else if (
                    n.message.includes("정기") ||
                    n.message.includes("Recurring")
                  )
                    linkTarget = "/transactions/recurring";
                  else if (
                    n.message.includes("백업") ||
                    n.message.includes("Backup")
                  )
                    linkTarget = "/settings/db";
                  else linkTarget = "/";
                }

                return (
                  <Link
                    key={n.id}
                    to={linkTarget}
                    onClick={() => handleLinkClick(n.id)}
                    className="flex flex-col w-full group outline-none select-none no-underline"
                  >
                    <div
                      className={`relative flex flex-col gap-0.5 p-3 border-b border-zinc-50 cursor-pointer transition-colors hover:bg-zinc-50/80 ${
                        !n.isRead ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* 읽지 않음 표시 사이드 바 */}
                      {!n.isRead && (
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-amber-500" />
                      )}

                      <div className="flex justify-between items-center pl-2">
                        <span
                          className={`text-[10px] font-semibold tracking-tight ${
                            !n.isRead ? "text-amber-600" : "text-zinc-400"
                          }`}
                        >
                          {n.type === "recurring"
                            ? "정기 내역 처리"
                            : n.type === "backup"
                              ? "자동 백업 완료"
                              : "알림"}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-normal line-clamp-2 pl-2">
                        {n.message}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-1.5 bg-zinc-50/30 border-t border-zinc-100">
          <Button
            variant="ghost"
            className="w-full text-[11px] text-zinc-400 hover:text-zinc-600 h-7 p-0"
          >
            모든 알림 보기
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
