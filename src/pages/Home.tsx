import { useState } from "react";
import TitleBar from "@/TitleBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumb } from "@/components/DinamicBreadcrumb";
import { PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderStore } from "@/store/useHeaderStore";
import { Separator } from "@/components/ui/separator";

function Home({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { title, actions } = useHeaderStore();

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
        <div className="h-12 shrink-0 z-50 bg-background">
          <TitleBar />
        </div>

        <div className="flex flex-1 overflow-y-auto">
          <div className="shrink-0">
            <AppSidebar collapsed={collapsed} />
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto bg-sidebar p-2">
            <div className="flex-none rounded-xl overflow-hiddenbg-background border shadow-sm p-4">
              {/* ✨ Zustand 기반 유동 헤더 */}
              <div className="shrink-0 flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded hover:bg-muted"
                  >
                    <PanelLeftClose
                      className={cn(
                        "h-6 w-6 transition-transform",
                        collapsed && "rotate-180"
                      )}
                    />
                  </button>
                  <Separator orientation="vertical" className="h-7 mx-1" />
                  <div className="flex flex-col">
                    {/* <DynamicBreadcrumb /> */}
                    <h2 className="text-2xl font-bold tracking-tight">
                      {title || ""}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">{actions}</div>
              </div>

              <div className="flex-1">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Home;
