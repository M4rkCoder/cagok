import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import TransactionForm from "./TransactionForm";
import { Plus } from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useConfirmStore } from "@/store/useConfirmStore";

// 1. Props 타입 정의 (선택적 속성)
interface TransactionSheetProps {
  triggerClassName?: string;
  triggerText?: string | ReactNode;
  variant?:
    | "default"
    | "link"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost";
  showIcon?: boolean;
  defaultCategoryId?: number; // 아이콘 표시 여부도 선택할 수 있게 하면 유연합니다.
}

const TransactionSheet = ({
  triggerClassName,
  triggerText,
  variant = "default",
  showIcon = true, // 기본값은 아이콘 표시
  defaultCategoryId,
}: TransactionSheetProps) => {
  const { t } = useTranslation();
  const {
    sheetOpen,
    setSheetOpen,
    editingTransaction,
    handleSheetClose,
    setDefaultCategoryId,
  } = useTransactionStore();

  const { isOpen } = useConfirmStore();

  const handleOpenChange = (open: boolean) => {
    if (isOpen) return;

    if (!open) {
      handleSheetClose();
      setDefaultCategoryId(null);
    } else {
      if (defaultCategoryId) {
        setDefaultCategoryId(defaultCategoryId);
      }
      setSheetOpen(true);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {/* 2. props가 있으면 사용하고, 없으면 기본값(기존 설정) 사용 */}
        <Button variant={variant} className={triggerClassName || "shadow-lg"}>
          {showIcon && <Plus className="h-6 w-6" />}
          {triggerText || t("new_transaction")}
        </Button>
      </SheetTrigger>

      <SheetContent
        data-tauri-drag-region={false}
        className="top-12 h-[calc(100vh-theme(spacing.12))]"
        onPointerDownOutside={(e) => {
          if (isOpen) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isOpen) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isOpen) e.preventDefault();
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {editingTransaction
              ? t("edit_transaction")
              : t("create_new_transaction")}
          </SheetTitle>
        </SheetHeader>
        <TransactionForm />
      </SheetContent>
    </Sheet>
  );
};

export default TransactionSheet;
