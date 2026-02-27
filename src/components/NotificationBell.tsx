import { useState } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";
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
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NotificationBell = () => {
  const { t } = useTranslation();
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

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 p-0 bg-white border-zinc-200 shadow-2xl z-[9999] rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/50 border-b">
          <h4 className="font-bold text-sm text-zinc-700 flex items-center gap-2">
            <Bell size={18} />
            {t("notifications.title")}
            {unreadCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </h4>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-white"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCircle2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 text-white border-none text-xs">
                  {t("notifications.mark_all_read")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-white"
                    onClick={() => clearAll()}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 text-white border-none text-xs">
                  {t("notifications.clear_all")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-zinc-400 gap-2">
              <Info size={32} className="opacity-20" />
              <p className="text-xs font-medium">{t("notifications.no_notifications")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                let linkTarget = n.link;
                if (!linkTarget) {
                  if (n.type === "recurring")
                    linkTarget = "/transactions/recurring";
                  else if (n.type === "backup") linkTarget = "/settings/db";
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
                      className={`relative flex flex-col gap-1 p-4 border-b border-zinc-50 cursor-pointer transition-colors hover:bg-zinc-50/80 ${
                        !n.isRead ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                      )}

                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            !n.isRead ? "text-amber-600" : "text-zinc-400"
                          }`}
                        >
                          {n.type === "recurring"
                            ? t("notifications.types.recurring")
                            : n.type === "backup"
                              ? t("notifications.types.backup")
                              : t("notifications.types.general")}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className={`text-sm leading-snug line-clamp-2 ${!n.isRead ? "text-zinc-900 font-bold" : "text-zinc-500 font-medium"}`}>
                        {n.message}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 bg-zinc-50/30 border-t border-zinc-100">
          <Button
            variant="ghost"
            className="w-full text-xs font-bold text-zinc-400 hover:text-zinc-600 h-8 p-0"
            onClick={() => markAllAsRead()}
          >
            {t("notifications.view_all")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
