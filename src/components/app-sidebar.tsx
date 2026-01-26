import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  LayoutDashboard,
  Settings,
  SquareLibrary,
  Pencil,
  ChartArea,
} from "lucide-react";
import { NavMain } from "./main-nav";
import { Button } from "@/components/ui/button";
import FinanceModeRounded from "./FinanceModeRounded";
import { useAppStore } from "@/store/useAppStore";
import { Link } from "react-router-dom";
import runSeed from "@/db/seed";

interface AppSidebarProps {
  collapsed: boolean;
}
const items = {
  MainMenu: [
    { title: "Dashboard", url: "#", icon: LayoutDashboard },
    {
      title: "Transaction",
      url: "#/transactions",
      icon: SquareLibrary,
    },
    { title: "Analysis", url: "#/", icon: ChartArea },
  ],
  Settings: [
    {
      title: "Settings",
      url: "#/settings",
      icon: Settings,
      isActive: false,
      items: [
        {
          title: "General",
          url: "#/settings",
        },
        {
          title: "Category",
          url: "#/settings/category",
        },
        {
          title: "Database",
          url: "#/settings/database",
        },
        {
          title: "Recurring",
          url: "#/settings/recurring",
        },
      ],
    },
  ],
};

const SIDEBAR_WIDTH = 180;
const SIDEBAR_COLLAPSED_WIDTH = 50;

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const { appName } = useAppStore();

  return (
    <aside
      className="h-full shrink-0 bg-sidebar transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden border-r"
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
      }}
    >
      {/* Header: 로고 영역 (border-b 삭제 및 px 유지) */}
      <div className="h-16 flex items-center px-[10px] overflow-hidden">
        <Link
          to="/"
          className="flex items-center flex-nowrap w-full group outline-none select-none"
        >
          {/* 1. 아이콘: 축소/확대 상관없이 이 자리에 고정 (shrink-0) */}
          <div className="shrink-0 flex items-center justify-center rounded-lg bg-black p-1.5 shadow-md group-hover:bg-slate-800 transition-colors">
            <FinanceModeRounded className="w-5 h-5 text-white" />
          </div>

          {/* 2. 텍스트 영역: collapsed 상태에 따라 렌더링 여부 결정 */}
          {!collapsed && (
            <div className="flex flex-col min-w-0 ml-3 transition-opacity duration-300 delay-150 opacity-100">
              <span className="text-[9px] font-black text-muted-foreground/50 tracking-[0.2em] leading-none mb-1 uppercase whitespace-nowrap">
                FINKRO
              </span>
              <span className="text-sm font-bold text-foreground leading-none truncate whitespace-nowrap">
                {appName || ""}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <SidebarContent className="flex-1 overflow-x-hidden">
        <SidebarGroup className="px-2">
          {/* 좌우 여백을 주어 아이콘이 너무 벽에 붙지 않게 함 */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.MainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                    className="flex items-center"
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <NavMain items={items.Settings} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <Button
          variant="secondary"
          className="w-full truncate overflow-hidden"
          onClick={(e) => {
            e.preventDefault(); // 혹시 모를 기본 동작 방지
            console.log("버튼을 클릭했습니다!");
            runSeed();
          }}
        >
          {!collapsed ? (
            <span className="transition-opacity duration-200 delay-100 opacity-100">
              더미 데이터 생성
            </span>
          ) : (
            "D"
          )}
        </Button>
      </SidebarFooter>
    </aside>
  );
}
