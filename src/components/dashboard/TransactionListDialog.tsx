import { TransactionWithCategory } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionListDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;

  transactions: TransactionWithCategory[];

  showDate?: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionListDialog({
  open,
  title,
  subtitle,
  transactions,
  showDate = false,
  onOpenChange,
}: TransactionListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </DialogHeader>

        {transactions.length > 0 ? (
          <div className="space-y-3 max-h-100 overflow-y-auto">
            {transactions.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">{item.category_icon ?? "📁"}</div>

                  <div>
                    <div className="font-medium">{item.description}</div>

                    <div className="text-xs text-gray-500 flex gap-2">
                      <span>{item.category_name ?? "미분류"}</span>

                      {/* ⭐ 날짜 조건부 표시 */}
                      {showDate && (
                        <>
                          <span>·</span>
                          <span>{item.date}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`font-semibold ${
                    item.type === 1 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {item.amount.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-6">
            거래 내역이 없습니다
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
