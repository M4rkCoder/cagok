import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import TransactionForm from "./TransactionForm";
import { Trash2 } from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";

const TransactionSheet = () => {
  const { t } = useTranslation();
  const {
    sheetOpen,
    setSheetOpen,
    editingTransaction,
    handleSheetClose,
    isConfirmOpen,
  } = useTransactionStore();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleSheetClose();
    } else {
      setSheetOpen(true);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange} modal={false}>
      <SheetTrigger asChild>
        <Button variant="outline">{t("new_transaction")}</Button>
      </SheetTrigger>
      <SheetContent
        data-tauri-drag-region={false}
        className="top-12 h-[calc(100vh-theme(spacing.12))]"
        // 다이얼로그가 열려있을 때 시트 외부 클릭으로 닫히는 것 방지
        onPointerDownOutside={(e) => {
          if (isConfirmOpen) e.preventDefault();
        }}
        // 다이얼로그가 포커스를 가져갈 때 시트가 닫히는 것 방지
        onInteractOutside={(e) => {
          if (isConfirmOpen) e.preventDefault();
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
