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
import TransactionForm from "@/components/TransactionForm";
import { Transaction, TransactionFormValues, Category } from "@/types";
import { Trash2 } from "lucide-react";

interface TransactionSheetProps {
  sheetOpen: boolean;
  setSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingTransaction: Transaction | null;
  handleFormSubmit: (values: TransactionFormValues) => Promise<void>;
  handleSheetClose: () => void;
  categories: Category[];
  handleDeleteClick: (id: number) => void;
}

const TransactionSheet: React.FC<TransactionSheetProps> = ({
  sheetOpen,
  setSheetOpen,
  editingTransaction,
  handleFormSubmit,
  handleSheetClose,
  categories,
  handleDeleteClick,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
      <SheetTrigger asChild>
        <Button variant="outline">{t("new_transaction")}</Button>
      </SheetTrigger>
      <SheetContent
        data-tauri-drag-region={false}
        className="top-11 h-[calc(100vh-theme(spacing.11))]"
      >
        <SheetHeader>
          <SheetTitle>
            {editingTransaction
              ? t("edit_transaction")
              : t("create_new_transaction")}
          </SheetTitle>
        </SheetHeader>
        <TransactionForm
          onSubmit={handleFormSubmit}
          onCancel={handleSheetClose}
          defaultValues={editingTransaction || undefined}
          categories={categories}
        />
        {editingTransaction && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!editingTransaction?.id) return;
              handleDeleteClick(editingTransaction.id);
            }}
          >
            <Trash2 />
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TransactionSheet;
