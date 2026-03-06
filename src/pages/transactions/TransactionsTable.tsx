import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useSettingStore } from "@/stores/useSettingStore";
import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const TransactionsTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { dateFormat } = useSettingStore();
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
      title: t("dialog.confirm_delete"),
      description: t("dialog.delete_transaction_message"),
      onConfirm: async () => {
        await deleteTransaction(id);
      },
    });
  };

  const onClickBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id as number);

    confirm({
      title: t("dialog.bulk_delete_title"),
      description: t("dialog.bulk_delete_confirm", { count: ids.length }),
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
        header: t("common.date"),
        cell: ({ row }) => {
          let displayDate = row.original.date.replace(/-/g, ".");
          try {
            const parsedDate = parseISO(row.original.date);
            if (!isNaN(parsedDate.getTime())) {
              displayDate = format(parsedDate, dateFormat, {
                locale: i18n.language === "ko" ? ko : enUS,
              });
            }
          } catch (e) {
            // parsing failed, fallback to default displayDate
          }
          return (
            <div className="flex justify-start items-center h-full text-sm">
              {displayDate}
            </div>
          );
        },
        size: 130, // Set initial size for date column
        minSize: 110,
        enableResizing: true,
      },
      {
        accessorKey: "type",
        header: t("common.type"),
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
        header: t("common.category"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start gap-1 h-full">
            <CategoryIcon
              icon={row.original.category_icon}
              type={row.original.type}
              size="xs"
            />
            <span>
              {row.original.category_name || t("transaction.no_category")}
            </span>
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
        header: t("common.description"),
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
        header: t("common.amount"),
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
        header: t("common.remarks"),
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

      <div className="relative w-full overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pagination.pageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            <TransactionTableContent table={table} loading={loading} />
          </motion.div>
        </AnimatePresence>
      </div>

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
                  {t("common.count", {
                    count: Object.keys(rowSelection).length,
                  })}{" "}
                  {t("common.delete")}
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
