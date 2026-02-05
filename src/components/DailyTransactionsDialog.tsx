import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import type { TransactionWithCategory } from "@/types/transaction";

interface DailyTransactionsDialogProps {
  date: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const DailyTransactionsDialog: React.FC<DailyTransactionsDialogProps> = ({
  date,
  isOpen,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    [],
  );

  useEffect(() => {
    if (isOpen && date) {
      const fetchTransactions = async () => {
        try {
          const fetchedTransactions = await invoke<TransactionWithCategory[]>(
            "get_transactions_by_date",
            { date },
          );
          setTransactions(fetchedTransactions);
        } catch (error) {
          console.error("Failed to fetch daily transactions:", error);
          toast.error("일별 거래 내역을 불러오는 데 실패했습니다.");
          setTransactions([]);
        }
      };
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [isOpen, date]);

  const formattedDate = date
    ? format(new Date(date), "yyyy년 MM월 dd일", { locale: ko })
    : "";
  const totalExpense = transactions.reduce(
    (sum, tx) => (tx.type === 1 ? sum + tx.amount : sum),
    0,
  );
  const totalIncome = transactions.reduce(
    (sum, tx) => (tx.type === 0 ? sum + tx.amount : sum),
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-12 bottom-0 translate-y-0 my-auto h-fit sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{formattedDate} 내역</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>총 수입:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {totalIncome.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>총 지출:</span>
            <span className="text-rose-600 dark:text-rose-400">
              {totalExpense.toLocaleString()}원
            </span>
          </div>
          <Separator />
          {transactions.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tx.category_icon}</span>
                    <span>{tx.category_name || "카테고리 없음"}</span>
                    <span className="text-muted-foreground">
                      {tx.description}
                    </span>
                  </div>
                  <span
                    className={
                      tx.type === 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {tx.type === 0 ? "+" : "-"}
                    {tx.amount.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              이 날짜에는 거래 내역이 없습니다.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyTransactionsDialog;
