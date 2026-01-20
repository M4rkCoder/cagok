import { useState } from "react";
import TitleBar from "@/TitleBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function Home({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
        {/* 1️⃣ TitleBar */}
        <div className="h-12 shrink-0 z-50 bg-background">
          <TitleBar />
        </div>

        {/* 2️⃣ Sidebar + 콘텐츠 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 사이드바는 고정 */}
          <div className="shrink-0">
            <AppSidebar collapsed={collapsed} />
          </div>

          {/* 콘텐츠 영역 - 스크롤 가능, 배경은 사이드바와 동일 */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-sidebar p-2">
            {/* 카드형 콘텐츠 */}
            <div className="flex flex-col rounded-xl bg-background border shadow-sm p-3">
              {/* 콘텐츠 헤더 */}
              <div className="shrink-0 border-b pb-1 mb-4 flex items-center">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="p-2 rounded hover:bg-muted"
                >
                  <ChevronLeft
                    className={cn(
                      "h-4 w-4 transition-transform",
                      collapsed && "rotate-180"
                    )}
                  />
                </button>
              </div>

              {/* 실제 콘텐츠 */}
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Home;
