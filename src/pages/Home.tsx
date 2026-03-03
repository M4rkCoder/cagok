import { useState, useEffect } from "react";
import TitleBar from "@/TitleBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderStore } from "@/stores/useHeaderStore";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { Separator } from "@/components/ui/separator";
import TransactionSheet from "./transactions/TrasactionSheet";
import { useNavigate } from "react-router-dom";

function Home({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { title, actions } = useHeaderStore();
  const { isOpen, options, closeConfirm } = useConfirmStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 2. 단축키 조건: (타이핑 중이 아닐 때 'e' 단일 키) OR (Ctrl + E)
      const isSingleKeyE =
        !isTyping &&
        e.key.toLowerCase() === "e" &&
        !isCtrlOrCmd &&
        !e.altKey &&
        !e.shiftKey;
      const isComboKeyE = isCtrlOrCmd && e.key.toLowerCase() === "e";

      if (isSingleKeyE || isComboKeyE) {
        e.preventDefault(); // 브라우저 기본 동작(검색창 포커스 등) 방지

        // 다이얼로그가 열려있을 때는 이동하지 않게 하려면 아래 주석 해제
        // if (isOpen) return;

        navigate("/transactions/quickentry");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]); // isOpen을 의존성 배열에 추가할 수 있습니다.

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
        <header className="h-12 shrink-0 z-[100] bg-background">
          <TitleBar />
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="shrink-0">
            <AppSidebar collapsed={collapsed} />
          </div>

          <main className="flex-1 flex flex-col overflow-y-auto bg-sidebar p-2 relative custom-scroll">
            <div className="flex-none rounded-xl bg-background border shadow-sm p-4">
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
                    <h2 className="text-2xl font-bold tracking-tight">
                      {title || ""}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">{actions}</div>
              </div>

              <div className="flex-1">{children}</div>
            </div>
          </main>
          {/* 전역 컨펌 다이얼로그 */}
          {options && (
            <ConfirmDialog
              open={isOpen}
              onOpenChange={(open) => !open && closeConfirm()}
              title={options.title}
              description={options.description}
              confirmText={options.confirmText}
              cancelText={options.cancelText}
              onConfirm={options.onConfirm}
            />
          )}
          <TransactionSheet>
            <button className="hidden"></button>
          </TransactionSheet>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Home;
