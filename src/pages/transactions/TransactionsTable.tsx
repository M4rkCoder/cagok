import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Transaction, TransactionWithCategory } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import TransactionTableContent from "./components/TransactionTableContent";
import TransactionPagination from "./components/TransactionPagination";
import { Pencil, Trash2 } from "lucide-react";
import { ExpenseBadge, IncomeBadge } from "./TransactionBadge";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { TransactionFilterPanel } from "./components/TransactionFilterPanel";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

const TransactionsTable: React.FC = () => {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const { formatAmount } = useCurrencyFormatter();
  const {
    transactions,
    loading,
    fetchFilteredAll,
    deleteTransaction,
    deleteBulkTransactions,
    setEditingTransaction,
    setSheetOpen,
    setFilters, // To reset filters on mount
  } = useTransactionStore();
  const { confirm } = useConfirmStore();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const onClickDelete = (id: number) => {
    confirm({
      title: "가계부 기록 삭제",
      description:
        "이 거래 내역을 정말 삭제하시겠습니까? \n 삭제 후에는 복구할 수 없습니다.",
      onConfirm: async () => {
        await deleteTransaction(id);
      },
    });
  };

  const onClickBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id as number);

    confirm({
      title: t("선택 항목 삭제"),
      description: `${ids.length}개의 내역을 정말 삭제하시겠습니까?`,
      onConfirm: async () => {
        await deleteBulkTransactions(ids);
        setRowSelection({}); // 삭제 후 선택 초기화
      },
    });
  };

  useEffect(() => {
    // Mount 시 필터 초기화 및 전체 데이터 로드
    setFilters({});
    fetchFilteredAll({});
  }, [fetchFilteredAll, setFilters]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  };

  const columns: ColumnDef<TransactionWithCategory>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center items-center w-full">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
              className="data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white border-slate-300"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center items-center w-full h-full">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white border-slate-300"
            />
          </div>
        ),
        size: 50,
        enableResizing: false,
      },
      {
        accessorKey: "date",
        header: t("date"),
        cell: ({ row }) => (
          <div className="flex justify-start items-center h-full text-sm">
            {row.original.date.replace(/-/g, ".")}
          </div>
        ),
        size: 130, // Set initial size for date column
        minSize: 110,
        enableResizing: true,
      },
      {
        accessorKey: "type",
        header: t("type"),
        cell: ({ row }) => (
          <div className="flex justify-start items-center h-full">
            {row.original.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
          </div>
        ),
        size: 90, // Set initial size for type column
        minSize: 70,
        enableResizing: true,
      },
      {
        accessorKey: "category",
        header: t("category"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start gap-1 h-full">
            <CategoryIcon
              icon={row.original.category_icon}
              type={row.original.type}
              size="xs"
            />
            <span>{row.original.category_name || t("no_category")}</span>
            {row.original.is_fixed ? (
              <span className="text-[10px] native-emoji">📌</span>
            ) : null}
          </div>
        ),
        size: 130, // Set initial size for category column
        minSize: 120,
        enableResizing: true,
      },
      {
        accessorKey: "description",
        header: t("description"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start h-full">
            <span className="text-sm font-medium">
              {row.original.description}
            </span>
          </div>
        ),
        size: 230, // Set initial size for description column
        minSize: 200,
        enableResizing: true,
      },
      {
        accessorKey: "amount",
        header: t("amount"),
        cell: ({ row }) => (
          <div className="flex justify-start items-center h-full gap-1">
            <span className="font-extrabold">
              {formatAmount(row.original.amount)}
            </span>
          </div>
        ),
        size: 150, // Increased size for amount column
        minSize: 120,
        enableResizing: true,
      },
      {
        accessorKey: "remarks",
        header: t("remarks"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start h-full">
            {row.original.remarks}
          </div>
        ),
        size: 100, // Set initial size for remarks column
        minSize: 80,
        enableResizing: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-center space-x-2 h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Pencil
                  onClick={() => handleEdit(row.original)}
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-600"
                />
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("edit")}</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trash2
                  onClick={() => onClickDelete(row.original.id!)}
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-600"
                />
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("delete")}</span>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 100, // Reduced size for actions column
        minSize: 90,
        maxSize: 120,
        enableResizing: true,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: transactions, // Use transactions from store directly
    columns,
    columnResizeMode: "onChange",
    state: {
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
  });

  return (
    <div className="container p-0 max-w-7xl mx-auto py-1 relative px-4">
      {/* 상단 고정 필터 패널 (항상 표시) */}
      <div className={cn("sticky top-0 z-40 -mx-4 px-4 pb-1 pt-2 mb-4")}>
        <div className="max-w-4xl mx-auto">
          <TransactionFilterPanel />
        </div>
      </div>

      {/* Table Content */}
      <TransactionTableContent table={table} loading={loading} />

      <div className="grid grid-cols-10 items-center w-full">
        <div className="col-span-9">
          <TransactionPagination table={table} />
        </div>

        <div className="col-span-1 flex justify-end">
          {Object.keys(rowSelection).length > 0 ? (
            <div className="flex items-center p-2 px-4 rounded-lg fade-in duration-100 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClickBulkDelete}
                className="h-8 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="text-sm font-medium">
                  {Object.keys(rowSelection).length}개 {t("delete")}
                </span>
              </Button>
            </div>
          ) : (
            <div className="h-12 w-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
