import { TransactionWithCategory } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Pin, Pencil, Trash2 } from "lucide-react";
import { CategoryIcon, FixIcon } from "@/components/CategoryIcon";
import { ExpenseBadge, IncomeBadge } from "../TransactionBadge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface Props {
  transactions: TransactionWithCategory[];
  selectedIds: number[];
  onEdit?: (tx: TransactionWithCategory) => void;
  onDelete?: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: (ids: number[], checked: boolean) => void;
}

export function TransactionDetailTable({
  transactions,
  selectedIds,
  onEdit,
  onDelete,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const { t } = useTranslation();
  // 1. 수입(0) -> 지출(1) 순으로 정렬
  const { formatAmount } = useCurrencyFormatter();
  const sortedTransactions = [...transactions].sort((a, b) => a.type - b.type);

  const allSelected =
    sortedTransactions.length > 0 &&
    sortedTransactions.every((tx) => selectedIds.includes(tx.id));

  return (
    <div className="ml-16 mt-2 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <div className="flex justify-center items-center">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        onToggleSelectAll(
                          sortedTransactions.map((t) => t.id),
                          !!checked
                        )
                      }
                      className="border-slate-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                    />
                  </div>
                </TableHead>
                <TableHead className="pl-5 w-[80px] font-bold">{t("type")}</TableHead>
                <TableHead className="w-[150px] font-bold">{t("category")}</TableHead>
                <TableHead className="w-[150px] font-bold">{t("quick_entry.headers.description")}</TableHead>
                <TableHead className="w-[150px] font-bold">{t("amount")}</TableHead>
                <TableHead className="w-[100px] font-bold">{t("remarks")}</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex justify-center items-center">
                        <Checkbox
                          checked={selectedIds.includes(tx.id)}
                          onCheckedChange={() => onToggleSelect(tx.id)}
                          className="border-slate-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                        />
                      </div>
                    </TableCell>
                    {/* 수입 지출 유형 */}
                    <TableCell>
                      <div className="pl-1 flex items-center gap-2.5">
                        {tx.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                      </div>
                    </TableCell>
                    {/* 카테고리 (+ 고정 핀) */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="relative text-xl shrink-0">
                          <CategoryIcon
                            type={tx.type}
                            icon={tx.category_icon}
                            size="sm"
                          />
                          {tx.is_fixed === 1 && <FixIcon />}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-700 truncate">
                            {tx.category_name}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* 설명 */}
                    <TableCell className="text-sm text-slate-600 font-medium">
                      {tx.description}
                    </TableCell>

                    {/* 금액 */}
                    <TableCell
                      className={`font-bold tabular-nums ${
                        tx.type === 0 ? "text-emerald-600" : "text-blue-600"
                      }`}
                    >
                      {formatAmount(tx.amount)}
                    </TableCell>
                    {/* 메모 (Remarks) */}
                    <TableCell className="text-sm text-slate-400 italic items-center">
                      {tx.remarks || ""}
                    </TableCell>

                    {/* 액션 버튼 */}
                    <TableCell>
                      <div className="flex justify-center space-x-2 h-full items-center mr-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Pencil
                              onClick={() => onEdit?.(tx)}
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-600"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{t("common.edit")}</span>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Trash2
                              onClick={() => onDelete?.(tx.id)}
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-600"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{t("common.delete")}</span>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-slate-400"
                  >
                    {t("no_transactions_found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
