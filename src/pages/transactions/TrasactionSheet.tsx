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

interface TransactionSheetProps {
  children?: ReactNode;
  defaultCategoryId?: number;
}

const TransactionSheet = ({
  children,
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

  const { isOpen: isConfirmOpen } = useConfirmStore();

  const handleOpenChange = (open: boolean) => {
    if (isConfirmOpen) return;

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
        {children ? (
          children
        ) : (
          <Button variant="default" className="shadow-lg cursor-pointer">
            <Plus className="h-6 w-6" />
            {t("new_transaction")}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        data-tauri-drag-region={false}
        className="top-12 h-[calc(100vh-theme(spacing.12))]"
        onPointerDownOutside={(e) => {
          if (isConfirmOpen) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isConfirmOpen) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
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
