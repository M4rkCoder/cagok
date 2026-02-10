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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ExpenseBadge, IncomeBadge } from "../TransactionBadge";

interface Props {
  transactions: TransactionWithCategory[];
  onEdit?: (tx: TransactionWithCategory) => void;
  onDelete?: (id: number) => void;
}

export function TransactionDetailTable({
  transactions,
  onEdit,
  onDelete,
}: Props) {
  // 1. 수입(0) -> 지출(1) 순으로 정렬
  const sortedTransactions = [...transactions].sort((a, b) => a.type - b.type);

  return (
    <div className="ml-16 mt-2 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 w-[80px] font-bold">유형</TableHead>
                <TableHead className="w-[150px] font-bold">카테고리</TableHead>
                <TableHead className="w-[150px] font-bold">상세 내역</TableHead>
                <TableHead className="w-[150px] font-bold">금액</TableHead>
                <TableHead className="w-[100px] font-bold">메모</TableHead>
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
                    {/* 수입 지출 유형 */}
                    <TableCell>
                      <div className="pl-1 flex items-center gap-2.5">
                        {tx.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                      </div>
                    </TableCell>
                    {/* 카테고리 (+ 고정 핀) */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl native-emoji shrink-0">
                          <CategoryIcon
                            type={tx.type}
                            icon={tx.category_icon}
                            size="sm"
                          />
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-700 truncate">
                            {tx.category_name}
                          </span>
                          {tx.is_fixed === 1 && (
                            <Pin className="h-3 w-3 text-slate-400 fill-slate-400 rotate-45 shrink-0" />
                          )}
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
                      {tx.amount.toLocaleString()}원
                    </TableCell>
                    {/* 메모 (Remarks) */}
                    <TableCell className="text-sm text-slate-400 italic items-center">
                      {tx.remarks || ""}
                    </TableCell>

                    {/* 액션 버튼 */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => onEdit?.(tx)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>수정</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(tx.id)}
                            className="flex items-center gap-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-slate-400"
                  >
                    이 날의 거래 내역이 없습니다.
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
