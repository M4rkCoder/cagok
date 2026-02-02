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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanceModeRounded from "./FinanceModeRounded";
import { useAppStore } from "@/store/useAppStore";
import { Link, useLocation, NavLink } from "react-router-dom";
import runSeed from "@/db/seed";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
}
const items = {
  MainMenu: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    {
      title: "Transaction",
      url: "/transactions",
      icon: SquareLibrary,
    },
    { title: "Statistics", url: "/statistics", icon: ChartArea },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
};

const SIDEBAR_WIDTH = 180;
const SIDEBAR_COLLAPSED_WIDTH = 50;

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const { appName } = useAppStore();

  const location = useLocation();
  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
              "shrink-0 flex items-center justify-center rounded-lg bg-black p-1.5 shadow-md transition-all duration-300",
              collapsed ? "w-8 h-8 scale-110" : "w-7 h-7" // 3. 축소 시 로고 크기 확대
            )}
          >
            <FinanceModeRounded className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 ml-3 animate-in fade-in duration-500">
              <span className="text-[9px] font-black text-muted-foreground/50 tracking-[0.2em] leading-none mb-1 uppercase">
                FINKRO
              </span>
              <span className="text-sm font-bold text-foreground leading-none truncate">
                {appName || ""}
              </span>
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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                      variant={isActive(item.url) ? "default" : "outline"}
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={cn(
                            "shrink-0",
                            collapsed ? "h-7 w-7 scale-120" : "h-6 w-6",
                            isActive(item.url)
                              ? "text-black"
                              : "text-muted-foreground"
                          )}
                        />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
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
            collapsed && "h-10 p-0 hover:bg-sidebar-accent"
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
