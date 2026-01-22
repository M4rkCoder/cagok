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
  const { sheetOpen, setSheetOpen, editingTransaction, handleSheetClose } =
    useTransactionStore();

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
