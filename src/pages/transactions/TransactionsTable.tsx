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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import TransactionFilters from "./components/TransactionFilters";
import TransactionTableContent from "./components/TransactionTableContent";
import TransactionPagination from "./components/TransactionPagination";
import { SquarePen, Trash2 } from "lucide-react";
import { ExpenseBadge, IncomeBadge } from "./TransactionBadge";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useConfirmStore } from "@/store/useConfirmStore";

const TransactionsTable: React.FC = () => {
  const { t } = useTranslation();

  const {
    transactions,
    loading,
    fetchTransactions,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
  } = useTransactionStore();
  const { confirm } = useConfirmStore();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [filterType, setFilterType] = useState<string | null>(null); // 0: Income, 1: Expense
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchTriggerQuery, setSearchTriggerQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  };

  const columns: ColumnDef<TransactionWithCategory>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: t("date"),
        cell: ({ row }) => (
          <div className="flex justify-start items-center h-full text-sm">
            {row.original.date}
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
          <div className="flex items-center justify-start space-x-2 h-full">
            <span className="native-emoji">{row.original.category_icon}</span>
            <span>{row.original.category_name || t("no_category")}</span>
          </div>
        ),
        size: 130, // Set initial size for category column
        minSize: 120,
        enableResizing: true,
      },
      {
        accessorKey: "isFixed",
        header: t("fixed"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start h-full">
            {row.original.is_fixed === 1 && (
              <Badge className="h-5 px-1.5 py-0 bg-slate-200 hover:bg-slate-400 text-[10px] font-bold gap-0.5 flex items-center justify-center border-none">
                <span className="text-[10px] native-emoji">📌</span>
              </Badge>
            )}
          </div>
        ),
        size: 70, // Reduced size for isFixed column
        minSize: 50,
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
          <div className="flex justify-start items-center h-full font-extrabold">
            {row.original.amount.toLocaleString()}
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
                <SquarePen
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

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType === "fixed_expense") {
      // fixed_expense: type = 1, is_fixed=1
      filtered = filtered.filter((t) => t.type === 1 && t.is_fixed === 1);
    } else if (filterType !== null) {
      filtered = filtered.filter((t) => t.type === parseInt(filterType));
    }

    if (filterCategory !== null) {
      filtered = filtered.filter(
        (t) => t.category_id === parseInt(filterCategory)
      );
    }

    if (searchTriggerQuery) {
      const lowerCaseSearchQuery = searchTriggerQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description &&
            t.description.toLowerCase().includes(lowerCaseSearchQuery)) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchQuery))
      );
    }

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= endDate);
    }

    return filtered;
  }, [
    transactions,
    filterType,
    filterCategory,
    searchTriggerQuery,
    startDate,
    endDate,
  ]);

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <div className="container p-6 max-w-7xl mx-auto py-8">
      {/* Filters and New Transaction Button section */}
      <div className="flex items-center justify-between space-x-4 mb-6">
        <TransactionFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSearchTriggerQuery={setSearchTriggerQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </div>

      {/* Table Content */}
      <TransactionTableContent table={table} loading={loading} />

      {/* Pagination */}
      <TransactionPagination table={table} />
    </div>
  );
};

export default TransactionsTable;
