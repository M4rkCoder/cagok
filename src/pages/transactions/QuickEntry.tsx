import React, { useMemo } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Save } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/store/useTransactionStore";
import { QuickEntryTransactionRow } from "@/types";
import { useQuickEntry } from "./hooks/useQuickEntry";
import FixedCheckboxCell from "./components/FixedCheckboxCell";
import DateCell from "./components/DateCell";
import { InputCell } from "./components/InputCell";
import CategoryCell from "./components/CategoryCell";
import { AmountCell } from "./components/AmountCell";

const QuickEntry: React.FC = () => {
  const { categories } = useAppStore();
  const { submitForm } = useTransactionStore();

  const {
    data,
    setData,
    activeCell,
    setActiveCell,
    dragRange,
    rowErrors,
    updateData,
    onDragStart,
    handleSaveAll,
    createEmptyRow,
    handlePaste,
    batchUpdate,
    confirmUpdate,
  } = useQuickEntry(10, submitForm);

  const columns = useMemo<ColumnDef<QuickEntryTransactionRow>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        size: 40,
        cell: ({ row }) => (
          <span className="text-slate-400 text-[11px] flex justify-center">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "날짜",
        size: 120,
        cell: (ctx) => {
          const tableMeta = ctx.table.options.meta as any;
          return (
            <DateCell
              {...ctx}
              colIdx={1}
              onPaste={handlePaste}
              error={tableMeta.errors?.[`${ctx.row.index}-date`]}
            />
          );
        },
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 160,
        cell: (i) => (
          <CategoryCell
            {...i}
            colIdx={2}
            onPaste={handlePaste}
            error={rowErrors[i.row.original.id]?.category_id}
          />
        ),
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: (ctx) => (
          <FixedCheckboxCell {...ctx} colIdx={3} onPaste={handlePaste} />
        ),
      },
      {
        accessorKey: "description",
        header: "상세 내역",
        size: 180,
        cell: (i) => (
          <InputCell
            {...i}
            colIdx={4}
            error={rowErrors[i.row.original.id]?.description}
            onPaste={handlePaste}
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
        cell: (i) => (
          <AmountCell
            {...i}
            colIdx={5}
            error={rowErrors[i.row.original.id]?.amount}
            onPaste={handlePaste}
          />
        ),
      },
      {
        accessorKey: "remarks",
        header: "메모",
        size: 150,
        cell: (i) => (
          <InputCell
            {...i}
            colIdx={6}
            error={rowErrors[i.row.original.id]?.remarks}
            onPaste={handlePaste}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setData((prev) => prev.filter((_, i) => i !== row.index))
            }
            className="h-8 w-8 text-slate-400 hover:text-red-500 flex items-center justify-center"
          >
            <Minus size={14} />
          </Button>
        ),
      },
    ],
    [updateData, data.length, rowErrors]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
      setActiveCell,
      activeCell,
      categories,
      batchUpdate,
      onDragStart,
      dragRange,
      confirmUpdate,
    },
  });

  return (
    <div className="p-6 bg-slate-50 h-full">
      <div className="max-w-[1250px] mx-auto space-y-4">
        <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h2 className="font-bold">빠른 입력</h2>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSaveAll}
          >
            <Save size={16} className="mr-2" />
            저장
          </Button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm border-collapse table-fixed select-none">
            <thead className="bg-slate-50 border-b">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 border-r border-slate-200 text-slate-500 font-bold text-sm uppercase text-left"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.column.columnDef.header as string}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const colIdx = idx;

                    const isSelectedByDrag =
                      dragRange &&
                      dragRange.colIdx === colIdx &&
                      row.index >= Math.min(dragRange.start, dragRange.end) &&
                      row.index <= Math.max(dragRange.start, dragRange.end);
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "p-0 border-r border-slate-100 relative h-10 transitio-colors",
                          isSelectedByDrag && "bg-blue-100/40",
                          activeCell?.rowIndex === row.index &&
                            activeCell?.colIdx === idx &&
                            "bg-white z-20 outline-2 outline-blue-500 outline-offset-[-1px]"
                        )}
                        onClick={() =>
                          setActiveCell({ rowIndex: row.index, colIdx: idx })
                        }
                      >
                        {React.createElement(
                          cell.column.columnDef.cell as any,
                          cell.getContext()
                        )}
                        {isSelectedByDrag && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              setData((p) => [...p, createEmptyRow()]);
              setTimeout(
                () => setActiveCell({ rowIndex: data.length, colIdx: 1 }),
                50
              );
            }}
            className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border-t border-dashed"
          >
            <Plus size={16} />행 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
