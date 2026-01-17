import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TransactionForm from "@/components/TransactionForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Transaction, TransactionFormValues, Category } from "@/types";

interface TransactionDialogsProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  handleFormSubmit: (values: TransactionFormValues) => Promise<void>;
  handleDialogClose: () => void;
  categories: Category[];
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  handleConfirmDelete: () => Promise<void>;
}

const TransactionDialogs: React.FC<TransactionDialogsProps> = ({
  dialogOpen,
  setDialogOpen,
  editingTransaction,
  handleFormSubmit,
  handleDialogClose,
  categories,
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  handleConfirmDelete,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? t("edit_transaction") : t("create_new_transaction")}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleFormSubmit}
            onCancel={handleDialogClose}
            defaultValues={editingTransaction || undefined}
            categories={categories}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title={t("confirm_delete")}
        description={t("confirm_delete_transaction_message")}
      />
    </>
  );
};

export default TransactionDialogs;
