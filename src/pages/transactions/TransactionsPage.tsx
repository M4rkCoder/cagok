import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Transaction,
  Category,
  TransactionFormValues,
  TransactionWithCategory,
} from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import TransactionFilters from "./TransactionFilters";
import TransactionTableContent from "./TransactionTableContent";
import TransactionPagination from "./TransactionPagination";
import { Pin, Scroll, SquarePen, StickyNote, Trash2 } from "lucide-react";
import { ExpenseBadge, IncomeBadge } from "./TransactionBadge";
import TransactionSheet from "./TrasactionSheet";
import ConfirmDialog from "@/components/ConfirmDialog";

const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<
    number | null
  >(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });
  const [filterType, setFilterType] = useState<string | null>(null); // 0: Income, 1: Expense
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchTriggerQuery, setSearchTriggerQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const fetchedTransactions = await invoke<TransactionWithCategory[]>(
        "get_transactions_with_category",
      );
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", JSON.stringify(error));
      toast.error(t("failed_to_fetch_transactions"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await invoke<Category[]>("get_categories");
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", JSON.stringify(error));
      toast.error(t("failed_to_fetch_categories"));
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingTransaction(null);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setSheetOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    console.log("handleDeleteClick called with id:", id);
    setTransactionToDeleteId(id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    console.log(
      "handleConfirmDelete called. transactionToDeleteId:",
      transactionToDeleteId,
    );
    if (transactionToDeleteId !== null) {
      try {
        await invoke("delete_transaction", { id: transactionToDeleteId });
        toast.success(t("transaction_deleted_successfully"));
        fetchTransactions();
      } catch (error) {
        console.error("Failed to delete transaction:", JSON.stringify(error));
        toast.error(t("failed_to_delete_transaction"));
      } finally {
        setIsConfirmDialogOpen(false);
        setTransactionToDeleteId(null);
      }
    }
  };

  const handleFormSubmit = async (values: TransactionFormValues) => {
    try {
      if (editingTransaction) {
        await invoke("update_transaction", {
          id: editingTransaction.id!,
          transaction: {
            description: values.description,
            amount: values.amount,
            date: values.date,
            type: values.type,
            is_fixed: values.is_fixed,
            remarks: values.remarks ?? null,
            category_id:
              values.category_id !== undefined ? values.category_id : null,
          },
        });
        toast.success(t("transaction_updated_successfully"));
      } else {
        await invoke("create_transaction", {
          transaction: {
            description: values.description,
            amount: values.amount,
            date: values.date,
            type: values.type,
            is_fixed: values.is_fixed,
            remarks: values.remarks ?? null,
            category_id: values.category_id,
          },
        });
        toast.success(t("transaction_created_successfully"));
      }
      handleSheetClose();
      fetchTransactions();
    } catch (error) {
      console.error("Failed to save transaction:", JSON.stringify(error));
      toast.error(t("failed_to_save_transaction"));
    }
  };

  const columns: ColumnDef<TransactionWithCategory>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: t("date"),
        cell: ({ row }) => (
          <div className="flex justify-start items-center h-full">
            {row.original.date}
          </div>
        ),
        size: 120, // Set initial size for date column
        minSize: 100,
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
        size: 100, // Set initial size for type column
        minSize: 80,
        enableResizing: true,
      },
      {
        accessorKey: "category",
        header: t("category"),
        cell: ({ row }) => (
          <div className="flex items-center justify-start space-x-2 h-full">
            <span>{row.original.category_icon}</span>
            <span>{row.original.category_name || t("no_category")}</span>
          </div>
        ),
        size: 180, // Set initial size for category column
        minSize: 150,
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
        size: 260, // Set initial size for description column
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
            {row.original.remarks && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Scroll className="text-slate-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{row.original.remarks}</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
        size: 100, // Set initial size for remarks column
        minSize: 80,
        enableResizing: true,
      },
      {
        id: "actions",
        header: t("actions"),
        cell: ({ row }) => (
          <div className="flex justify-start space-x-2 h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(row.original)}
                >
                  <SquarePen />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("edit")}</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(row.original.id!)}
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t("delete")}</span>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 120, // Reduced size for actions column
        minSize: 90,
        maxSize: 150,
        enableResizing: true,
      },
    ],
    [t],
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
        (t) => t.category_id === parseInt(filterCategory),
      );
    }

    if (searchTriggerQuery) {
      const lowerCaseSearchQuery = searchTriggerQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description &&
            t.description.toLowerCase().includes(lowerCaseSearchQuery)) ||
          (t.remarks && t.remarks.toLowerCase().includes(lowerCaseSearchQuery)),
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
    <div className="container mx-auto py-8">
      {/* Title section */}
      <h1 className="text-3xl font-bold mb-6">{t("transactions")}</h1>

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
          categories={categories}
        />

        <TransactionSheet
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          editingTransaction={editingTransaction}
          handleFormSubmit={handleFormSubmit}
          handleSheetClose={handleSheetClose}
          categories={categories}
          handleDeleteClick={handleDeleteClick}
        />
      </div>

      {/* Table Content */}
      <TransactionTableContent table={table} loading={loading} />

      {/* Pagination */}
      <TransactionPagination table={table} />

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title={t("confirm_delete")}
        description={t("confirm_delete_transaction_message")}
      />
    </div>
  );
};

export default TransactionsPage;
