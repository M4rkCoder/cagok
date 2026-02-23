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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanceModeRounded from "./FinanceModeRounded";
import { useAppStore } from "@/store/useAppStore";
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
import { ProIcon } from "./ui/PlusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

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
          // 서브메뉴 추가
          {
            title: t("menu.quick_entry"),
            url: "/transactions/quickentry",
            icon: Zap,
            plus: true,
          },
          {
            title: t("menu.recurring"),
            url: "/transactions/recurring",
            icon: RefreshCw,
            plus: true,
          },
        ],
      },
      { title: t("menu.statistics"), url: "/statistics", icon: ChartArea },
      { title: t("menu.settings"), url: "/settings", icon: Settings },
    ],
  };

  useEffect(() => {
    const currentParent = items.MainMenu.find(
      (item) => item.subMenu && location.pathname.startsWith(item.url),
    );
    if (currentParent) {
      setOpenItem(currentParent.title);
    }
  }, [location.pathname]);

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
              collapsed ? "w-8 h-8 scale-110" : "w-7 h-7", // 3. 축소 시 로고 크기 확대
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
                              // ✅ 전체 배경은 투명하게 유지, 활성화 시 글자만 검정색으로 강조
                              isSubActive
                                ? "text-black font-bold"
                                : "text-sidebar-foreground",
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
                                {/* ✅ 아이콘: 활성화 시 정중앙에서부터 커지는 파란색 박스 효과 (framer-motion) */}
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
                                        : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
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
                                      ? "text-blue-700 font-bold" // ✅ 서브메뉴는 텍스트만 파란색 포인트
                                      : "text-muted-foreground",
                                  )}
                                >
                                  <div className="flex items-center gap-1 min-w-0 w-full">
                                    <span className="truncate">
                                      {sub.title}
                                    </span>
                                    {sub.plus && <ProIcon />}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      /* 일반 메뉴 또는 접힌 상태 */
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url) || isSubActive}
                        tooltip={collapsed ? item.title : undefined}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "relative flex items-center justify-center shrink-0",
                              collapsed ? "w-7 h-7" : "w-6 h-6",
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
                                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
                              )}
                            />
                          </div>
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
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
        <Button
          variant={collapsed ? "ghost" : "secondary"}
          className={cn(
            "w-full truncate overflow-hidden transition-all",
            collapsed && "h-10 p-0 hover:bg-sidebar-accent",
          )}
          onClick={(e) => {
            e.preventDefault();
            runSeed();
          }}
        >
          {!collapsed ? "더미 데이터 생성" : <Pencil className="h-4 w-4" />}
        </Button>
      </SidebarFooter>
    </aside>
  );
}
