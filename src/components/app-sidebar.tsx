import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  SquareLibrary,
  ChartArea,
  Pencil,
  Zap,
  RefreshCw,
  Info,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanceModeRounded from "./FinanceModeRounded";
import { useAppStore } from "@/stores/useAppStore";
import { Link, useLocation } from "react-router-dom";
import runSeed from "@/db/seed";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useEffect, useState } from "react";
// ui/tooltip 컴포넌트 임포트
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ShortcutGuide } from "@/pages/ShrtcutGuide";

interface AppSidebarProps {
  collapsed: boolean;
}
const SIDEBAR_WIDTH = 180;
const SIDEBAR_COLLAPSED_WIDTH = 60;

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const { t } = useTranslation();
  const { appName } = useAppStore();

  const location = useLocation();
  const [openItem, setOpenItem] = useState<string | undefined>("");
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const items = {
    MainMenu: [
      { title: t("menu.dashboard"), url: "/dashboard", icon: LayoutDashboard },
      {
        title: t("menu.transaction"),
        url: "/transactions",
        icon: SquareLibrary,
        subMenu: [
          {
            title: t("menu.quick_entry"),
            url: "/transactions/quickentry",
            icon: Zap,
          },
          {
            title: t("menu.recurring"),
            url: "/transactions/recurring",
            icon: RefreshCw,
          },
        ],
      },
      { title: t("menu.statistics"), url: "/statistics", icon: ChartArea },
      { title: t("menu.settings"), url: "/settings", icon: Settings },
    ],
  };

  useEffect(() => {
    const currentParent = items.MainMenu.find(
      (item) => item.subMenu && location.pathname.startsWith(item.url)
    );
    if (currentParent) {
      setOpenItem(currentParent.title);
    }
  }, [location.pathname]);

  // 푸터 버튼 (더미 생성) 노드 정의
  const FooterBtnNode = (
    <Button
      variant={collapsed ? "ghost" : "secondary"}
      className={cn(
        "w-full truncate overflow-hidden transition-all",
        collapsed && "h-10 p-0 hover:bg-sidebar-accent"
      )}
      onClick={(e) => {
        e.preventDefault();
        runSeed();
      }}
    >
      {!collapsed ? "더미 데이터 생성" : <Pencil className="h-4 w-4" />}
    </Button>
  );

  const AboutBtnNode = (
    <SidebarMenuButton
      asChild
      isActive={isActive("/about")}
      className={cn(
        "transition-all",
        collapsed ? "justify-center p-0 h-10" : "px-2"
      )}
    >
      <Link to="/about" className="flex items-center gap-2">
        <Info className={cn("shrink-0", collapsed ? "h-6 w-6" : "h-4 w-4")} />
        {!collapsed && (
          <span className="text-xs font-medium">{t("menu.about")}</span>
        )}
      </Link>
    </SidebarMenuButton>
  );

  const ShortcutBtnNode = (
    <SidebarMenuButton
      className={cn(
        "transition-all cursor-pointer",
        collapsed ? "justify-center p-0 h-10" : "px-2"
      )}
    >
      <div className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <Keyboard
          className={cn("shrink-0", collapsed ? "h-6 w-6" : "h-4 w-4")}
        />
        {!collapsed && <span className="text-xs font-medium">단축키 안내</span>}
      </div>
    </SidebarMenuButton>
  );

  return (
    <aside
      className="h-full shrink-0 bg-sidebar transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden border-r"
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
      }}
    >
      {/* Header: 로고 영역 */}
      <div className="h-16 flex items-center px-[10px] overflow-hidden">
        <Link
          to="/"
          className="flex items-center flex-nowrap w-full group outline-none select-none"
        >
          <div
            className={cn(
              "shrink-0 flex items-center justify-center rounded-lg bg-blue-700 p-1.5 shadow-md transition-all duration-300",
              collapsed ? "ml-1 w-8 h-8 scale-110" : "w-7 h-7"
            )}
          >
            <FinanceModeRounded className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 ml-3 animate-in fade-in duration-500">
              <span className="text-[9px] font-black text-muted-foreground/50 tracking-[0.2em] leading-none mb-1 uppercase">
                C'AGOK
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={appName}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-bold text-foreground leading-none truncate block"
                >
                  {appName || ""}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <SidebarContent className="flex-1 overflow-x-hidden">
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.MainMenu.map((item) => {
                const hasSubMenu = item.subMenu && item.subMenu.length > 0;
                const isSubActive =
                  hasSubMenu && location.pathname.startsWith(item.url);

                // 메뉴 버튼 엘리먼트 분리 (툴팁 래핑용)
                const MenuButtonNode = (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url) || isSubActive}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "relative flex items-center justify-center shrink-0",
                          collapsed ? "w-7 h-7" : "w-6 h-6"
                        )}
                      >
                        <AnimatePresence>
                          {(isActive(item.url) || isSubActive) && (
                            <motion.div
                              layoutId="sidebar-active-indicator"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                              className="absolute inset-0 bg-blue-700 rounded-md"
                            />
                          )}
                        </AnimatePresence>
                        <item.icon
                          className={cn(
                            "relative z-10 shrink-0 transition-colors duration-300",
                            collapsed ? "h-6 w-6" : "h-5 w-5",
                            isActive(item.url) || isSubActive
                              ? "text-white"
                              : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                          )}
                        />
                      </div>
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    {hasSubMenu && !collapsed ? (
                      <Accordion
                        type="single"
                        collapsible
                        value={openItem}
                        onValueChange={setOpenItem}
                        className="w-full border-none"
                      >
                        <AccordionItem
                          value={item.title}
                          className="border-none"
                        >
                          <AccordionTrigger
                            className={cn(
                              "py-1 px-2 hover:no-underline border-none rounded-md transition-colors hover:bg-sidebar-accent group",
                              isSubActive
                                ? "text-black font-bold"
                                : "text-sidebar-foreground"
                            )}
                          >
                            <SidebarMenuButton
                              asChild
                              isActive={isSubActive}
                              className="w-full bg-transparent hover:bg-transparent data-[active=true]:bg-transparent p-0"
                            >
                              <Link
                                to={item.url}
                                className="flex items-center gap-2"
                              >
                                <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                                  <AnimatePresence>
                                    {isSubActive && (
                                      <motion.div
                                        layoutId="sidebar-active-indicator"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 30,
                                        }}
                                        className="absolute inset-0 bg-blue-700 rounded-md"
                                      />
                                    )}
                                  </AnimatePresence>
                                  <item.icon
                                    className={cn(
                                      "relative z-10 h-5 w-5 shrink-0 transition-colors duration-300",
                                      isSubActive
                                        ? "text-white"
                                        : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                                    )}
                                  />
                                </div>
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </AccordionTrigger>

                          <AccordionContent className="pb-1 pt-1">
                            <div className="flex flex-col gap-1 ml-4 border-l border-muted-foreground/20">
                              {item.subMenu?.map((sub) => (
                                <Link
                                  key={sub.title + sub.url}
                                  to={sub.url}
                                  className={cn(
                                    "text-[13px] py-1.5 px-2 rounded-md transition-colors hover:bg-sidebar-accent flex items-center min-w-0 whitespace-nowrap overflow-hidden",
                                    isActive(sub.url)
                                      ? "text-blue-700 font-bold"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <div className="flex items-center gap-1 min-w-0 w-full">
                                    <span className="truncate">
                                      {sub.title}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : collapsed ? (
                      /* 접힌 상태: Tooltip 활성화 */
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          {MenuButtonNode}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="ml-1">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      /* 서브메뉴가 없는 일반 메뉴 펼친 상태 */
                      MenuButtonNode
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {/* 🔹 단축키 안내 버튼 (ShortcutGuide로 감싸기) */}
          <SidebarMenuItem>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  {/* TooltipTrigger와 DialogTrigger 충돌 방지를 위해 div로 한 번 감싸줍니다 */}
                  <div className="w-full">
                    <ShortcutGuide>{ShortcutBtnNode}</ShortcutGuide>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-1 z-[100]">
                  단축키 안내
                </TooltipContent>
              </Tooltip>
            ) : (
              <ShortcutGuide>{ShortcutBtnNode}</ShortcutGuide>
            )}
          </SidebarMenuItem>

          <SidebarMenuItem>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{AboutBtnNode}</TooltipTrigger>
                <TooltipContent side="right" className="ml-1 z-[100]">
                  About C'agok
                </TooltipContent>
              </Tooltip>
            ) : (
              AboutBtnNode
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        {/* 구분선 (펼쳐졌을 때만) */}
        {!collapsed && <div className="h-[1px] bg-sidebar-border mx-2 my-1" />}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{FooterBtnNode}</TooltipTrigger>
            <TooltipContent side="right" className="ml-1 z-[100]">
              더미 데이터 생성
            </TooltipContent>
          </Tooltip>
        ) : (
          FooterBtnNode
        )}
      </SidebarFooter>
    </aside>
  );
}
