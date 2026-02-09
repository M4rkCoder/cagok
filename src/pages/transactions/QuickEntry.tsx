import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Save } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, parseISO, isValid } from "date-fns";
import EditableCell from "./EditableCell";
import {
  transactionSchema,
  TransactionFormValues,
} from "@/schemas/transaction";
import { useTransactionStore } from "@/store/useTransactionStore";
import * as z from "zod";
import { toast } from "sonner";

export interface QuickEntryTransactionRow {
  id: string;
  date: string;
  type: number;
  category_id: string;
  is_fixed: number;
  description: string;
  amount: string;
  remarks: string;
}

const QuickEntry: React.FC = () => {
  const [dragRange, setDragRange] = useState<{
    start: number;
    end: number;
    colIdx: number;
  } | null>(null);
  const { categories } = useAppStore();
  const { submitForm } = useTransactionStore();

  const createEmptyRow = (): QuickEntryTransactionRow => ({
    id: crypto.randomUUID(),
    date: "",
    type: 1, // Default to expense
    category_id: "",
    is_fixed: 0,
    description: "",
    amount: "",
    remarks: "",
  });
  const [data, setData] = useState<QuickEntryTransactionRow[]>(() =>
    Array.from({ length: 10 }, createEmptyRow),
  );
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    colIdx: number;
  } | null>(null);
  const [rowErrors, setRowErrors] = useState<
    Record<string, Record<string, { message: string; timestamp: number }>>
  >({});

  const updateData = useCallback(
    (r: number, cid: string, val: any) => {
      setData((prev) =>
        prev.map((row, i) => (i === r ? { ...row, [cid]: val } : row)),
      );
      setRowErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[data[r].id]) {
          delete newErrors[data[r].id][cid]; // Clear error for the specific cell
          if (Object.keys(newErrors[data[r].id]).length === 0) {
            delete newErrors[data[r].id]; // If no errors left for the row, delete the row entry
          }
        }
        return newErrors;
      });
    },
    [data],
  );

  const batchUpdate = useCallback(
    (startRow: number, startCol: number, rows: string[][]) => {
      const colKeys = [
        "date",
        "category_id",
        "is_fixed",
        "description",
        "amount",
        "remarks",
      ];
      setData((prev) => {
        const newData = [...prev];
        rows.forEach((rowData, i) => {
          const tRow = startRow + i;
          if (tRow < newData.length) {
            rowData.forEach((val, j) => {
              const tColIdx = startCol - 1 + j;
              if (tColIdx < colKeys.length)
                newData[tRow] = { ...newData[tRow], [colKeys[tColIdx]]: val };
            });
          }
        });
        return newData;
      });
    },
    [],
  );

  const onDragStart = (
    e: React.MouseEvent,
    startRow: number,
    startCol: number,
  ) => {
    e.preventDefault();
    const colKeys = [
      "date",
      "category_id",
      "is_fixed",
      "description",
      "amount",
      "remarks",
    ];
    const key = colKeys[startCol - 1];
    const baseValue = data[startRow][key as keyof QuickEntryTransactionRow];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const target = moveEvent.target as HTMLElement;
      const cell = target.closest("td");
      if (cell) {
        const tr = cell.parentElement;
        if (tr) {
          const endRow = Array.from(tr.parentElement!.children).indexOf(tr);
          setDragRange({ start: startRow, end: endRow, colIdx: startCol });
          if (endRow > startRow) {
            setData((prev) => {
              const next = [...prev];
              for (let i = startRow + 1; i <= endRow; i++) {
                let newVal = baseValue;
                if (
                  key === "date" &&
                  typeof baseValue === "string" &&
                  baseValue
                ) {
                  const d = parseISO(baseValue);
                  if (isValid(d))
                    newVal = format(addDays(d, i - startRow), "yyyy-MM-dd");
                }
                next[i] = { ...next[i], [key]: newVal };
              }
              return next;
            });
          }
        }
      }
    };
    const onMouseUp = () => {
      setDragRange(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

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
        cell: (i) => (
          <EditableCell
            {...i}
            colIdx={1}
            error={rowErrors[i.row.original.id]?.date}
          />
        ),
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 160,
        cell: (i) => (
          <EditableCell
            {...i}
            colIdx={2}
            error={rowErrors[i.row.original.id]?.category_id}
          />
        ),
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: ({ row, table }) => {
          const { setActiveCell, activeCell, updateData, onDragStart } = table
            .options.meta as any;
          const isActive =
            activeCell?.rowIndex === row.index && activeCell?.colIdx === 3;
          const cbRef = useRef<HTMLButtonElement>(null);
          useEffect(() => {
            if (isActive) cbRef.current?.focus();
          }, [isActive]);
          return (
            <div className="relative w-full h-full group">
              <div
                className={cn(
                  "w-full h-full flex items-center justify-center transition-colors",
                  isActive && "bg-blue-100/50",
                )}
              >
                <Checkbox
                  ref={cbRef}
                  checked={row.original.is_fixed === 1}
                  disabled={row.original.type === 0}
                  onCheckedChange={(c) =>
                    updateData(row.index, "is_fixed", c ? 1 : 0)
                  }
                  onKeyDown={(e) => {
                    if (e.key === " ") e.stopPropagation();
                    if (e.key === "Tab") {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveCell({
                        rowIndex: row.index,
                        colIdx: e.shiftKey ? 2 : 4,
                      });
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveCell({
                        rowIndex: Math.max(0, row.index - 1),
                        colIdx: 3,
                      });
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveCell({
                        rowIndex: Math.min(data.length - 1, row.index + 1),
                        colIdx: 3,
                      });
                    }
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setActiveCell({ rowIndex: row.index, colIdx: 2 }); // 항목 열로 이동
                    }
                    if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setActiveCell({ rowIndex: row.index, colIdx: 4 }); // 설명 열로 이동
                    }
                  }}
                  className={cn(isActive && "ring-2 ring-blue-500")}
                />
              </div>
              <div
                onMouseDown={(e) => onDragStart(e, row.index, 3)}
                className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "상세 내역",
        size: 180,
        cell: (i) => (
          <EditableCell
            {...i}
            colIdx={4}
            error={rowErrors[i.row.original.id]?.description}
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
        cell: (i) => (
          <EditableCell
            {...i}
            colIdx={5}
            error={rowErrors[i.row.original.id]?.amount}
          />
        ),
      },
      {
        accessorKey: "remarks",
        header: "메모",
        size: 150,
        cell: (i) => (
          <EditableCell
            {...i}
            colIdx={6}
            error={rowErrors[i.row.original.id]?.remarks}
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
    [updateData, data.length, rowErrors],
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
    },
  });

  const handleSaveAll = async () => {
    const currentBatchErrors: Record<
      string,
      Record<string, { message: string; timestamp: number }>
    > = {};
    const transactionsToSubmit: TransactionFormValues[] = [];

    const filledData = data.filter(
      (row) =>
        row.date ||
        row.description ||
        row.amount ||
        row.remarks ||
        row.category_id,
    );

    if (filledData.length === 0) {
      toast.info("저장할 거래 내역이 없습니다.");
      return;
    }

    for (const row of filledData) {
      const parsedAmount = parseFloat(row.amount.replace(/,/g, ""));
      const parsedCategoryId = parseInt(row.category_id);

      const transactionToValidate = {
        type: row.type,
        is_fixed: row.is_fixed,
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        date: row.date,
        description: row.description,
        remarks: row.remarks || "",
        category_id: isNaN(parsedCategoryId) ? 0 : parsedCategoryId,
      };

      const result = transactionSchema.safeParse(transactionToValidate);

      if (!result.success) {
        currentBatchErrors[row.id] = {};
        result.error.issues.forEach((issue) => {
          const colId = issue.path[0] as string;
          currentBatchErrors[row.id][colId] = {
            message: issue.message,
            timestamp: Date.now(),
          };
        });
      } else {
        transactionsToSubmit.push(result.data);
      }
    }

    setRowErrors(currentBatchErrors);

    if (Object.keys(currentBatchErrors).length > 0) {
      toast.error("입력한 내용에 오류가 있습니다. 확인해주세요.");

      // Set timeouts to clear errors after 1 second
      Object.entries(currentBatchErrors).forEach(([rowId, colErrors]) => {
        Object.keys(colErrors).forEach((colId) => {
          setTimeout(() => {
            setRowErrors((prev) => {
              const newErrors = { ...prev };
              if (newErrors[rowId]) {
                delete newErrors[rowId][colId];
                if (Object.keys(newErrors[rowId]).length === 0) {
                  delete newErrors[rowId];
                }
              }
              return newErrors;
            });
          }, 1000);
        });
      });
      return;
    }

    for (const transaction of transactionsToSubmit) {
      await submitForm(transaction);
    }
    toast.success("모든 거래 내역이 성공적으로 저장되었습니다!");
    setData(Array.from({ length: 10 }, createEmptyRow));
    setRowErrors({});
  };

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
          <table className="w-full text-[13px] border-collapse table-fixed select-none">
            <thead className="bg-slate-50 border-b">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 border-r border-slate-200 text-slate-500 font-bold text-xs uppercase text-left"
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
                            "bg-white z-20 outline-2 outline-blue-500 outline-offset-[-1px]",
                        )}
                        onClick={() =>
                          setActiveCell({ rowIndex: row.index, colIdx: idx })
                        }
                      >
                        {React.createElement(
                          cell.column.columnDef.cell as any,
                          cell.getContext(),
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
                50,
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
