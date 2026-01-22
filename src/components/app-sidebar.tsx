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
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { NavMain } from "./main-nav";
import { Button } from "@/components/ui/button";
import FinanceModeRounded from "./FinanceModeRounded";

interface AppSidebarProps {
  collapsed: boolean;
}
const items = [
  { title: "Home", url: "#", icon: Home },
  { title: "Dashboard", url: "#", icon: LayoutDashboard },
  {
    title: "Transaction",
    url: "#/transactions",
    icon: SquareLibrary,
  },
  { title: "Write", url: "#/transactions/write", icon: Pencil },
  { title: "Settings", url: "#/settings", icon: Settings },
];

const SIDEBAR_WIDTH = 160;
const SIDEBAR_COLLAPSED_WIDTH = 50;

export function AppSidebar({ collapsed }: AppSidebarProps) {
  return (
    <aside
      className="h-full shrink-0 bg-sidebar transition-[width] duration-200 ease-out flex flex-col"
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
      }}
    >
      {/* Header */}
      <div className="h-12 flex items-center px-3 gap-2">
        {!collapsed ? (
          <>
            <div className="inline-flex items-center justify-center rounded-md bg-black p-1">
              <FinanceModeRounded className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-sidebar-foreground/70">
              FINKRO
            </span>
          </>
        ) : (
          <div className="inline-flex items-center justify-center rounded-md bg-black p-1">
            <FinanceModeRounded className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <NavMain items={items} /> */}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <Button variant="secondary" className="w-full">
          {!collapsed && "더미 데이터 생성"}
        </Button>
      </SidebarFooter>
    </aside>
  );
}
