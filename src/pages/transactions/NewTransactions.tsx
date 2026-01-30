import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  CellContext,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Minus } from "lucide-react";
import { format } from "date-fns";
import { useHeaderStore } from "@/store/useHeaderStore";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Category } from "@/types";

// --- Type Definitions ---
interface TransactionRow {
  id: string;
  date: string;
  type: number;
  category_id: string;
  is_fixed: number;
  description: string;
  amount: string;
  remarks: string;
}

interface EditableCellProps extends CellContext<TransactionRow, any> {
  meta: {
    updateData: (rowIndex: number, columnId: string, value: any) => void;
    setActiveCell: (
      cell: { rowIndex: number; columnId: string } | null,
    ) => void;
    categories: Category[];
  };
}

// --- EditableCell Component (Refactored) ---
const EditableCell: React.FC<EditableCellProps> = ({
  getValue,
  row,
  column,
  table,
}: any) => {
  const initialValue = getValue();
  const { updateData, setActiveCell, categories } = table.options.meta;
  const rowType = row.original.type;

  const [value, setValue] = useState(initialValue);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    if (initialValue !== value) {
      updateData(row.index, column.id, value);
    }
  };

  const onFocus = () => {
    setActiveCell({ rowIndex: row.index, columnId: column.id });
  };

  const columnMeta = column.columnDef.meta as any;
  const columnType = columnMeta?.type;
  const columnId = column.id;

  if (columnType === "select") {
    const options =
      columnId === "category_id"
        ? categories.filter((cat: any) => cat.type === rowType)
        : columnMeta?.options || [];

    return (
      <Select
        value={value !== null && value !== undefined ? String(value) : ""}
        onValueChange={(newValue) => {
          if (columnId === "type") {
            updateData(row.index, columnId, Number(newValue));
            updateData(row.index, "category_id", "");
          } else {
            updateData(row.index, columnId, newValue);
          }
        }}
        onOpenChange={(open) => {
          if (open) onFocus();
          else setActiveCell(null);
        }}
      >
        <SelectTrigger
          className={cn(
            "w-full h-8 text-[13px] bg-transparent border-none focus:ring-0 focus:ring-offset-0",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <SelectValue placeholder="선택" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: any) => {
            const displayName = opt.label || opt.name;
            const displayValue = opt.value !== undefined ? opt.value : opt.id;
            return (
              <SelectItem key={displayValue} value={String(displayValue)}>
                {opt.icon ? `${opt.icon} ${displayName}` : displayName}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (columnType === "date") {
    return (
      <Input
        type="date"
        value={value ?? ""}
        onFocus={onFocus}
        onChange={(e) => updateData(row.index, column.id, e.target.value)}
        className="w-full h-8 bg-transparent px-2 text-center outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-none"
      />
    );
  }

  return (
    <Input
      type={columnType === "number" ? "number" : "text"}
      value={value ?? ""}
      onFocus={onFocus}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      placeholder="입력..."
      className={cn(
        "w-full h-8 bg-transparent px-2 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-none transition-all",
        columnType === "number" &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      )}
    />
  );
};

// --- Main Component ---
const NewTransactions: React.FC = () => {
  const { t } = useTranslation();
  const { categories } = useAppStore();
  const { setHeader, resetHeader } = useHeaderStore();

  const createEmptyRow = useCallback(
    (): TransactionRow => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      date: "",
      type: 1,
      category_id: "",
      is_fixed: 0,
      description: "",
      amount: "",
      remarks: "",
    }),
    [],
  );

  const [data, setData] = useState<TransactionRow[]>(() =>
    Array.from({ length: 20 }, createEmptyRow),
  );
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ r: number; c: string } | null>(
    null,
  );
  const [dragEndRow, setDragEndRow] = useState<number | null>(null);

  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setData((old) =>
        old.map((row, index) =>
          index === rowIndex ? { ...row, [columnId]: value } : row,
        ),
      );
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEndRow !== null) {
      const sourceValue =
        data[dragStart.r][dragStart.c as keyof TransactionRow];
      const start = Math.min(dragStart.r, dragEndRow);
      const end = Math.max(dragStart.r, dragEndRow);

      setData((old) =>
        old.map((row, idx) => {
          if (idx >= start && idx <= end) {
            return { ...row, [dragStart.c]: sourceValue };
          }
          return row;
        }),
      );
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEndRow(null);
  }, [isDragging, dragStart, dragEndRow, data]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleSaveAll = useCallback(() => {
    const validData = data.filter((row) => row.date && row.amount);
    console.log("DB로 전송될 유효 데이터:", validData);
    alert(`${validData.length}건의 데이터가 준비되었습니다.`);
  }, [data]);

  useEffect(() => {
    setHeader(
      t("대량 입력 모드"),
      <Button
        onClick={handleSaveAll}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="w-4 h-4 mr-2" /> {t("저장")}
      </Button>,
    );
    return () => resetHeader();
  }, [setHeader, resetHeader, t, handleSaveAll]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const rows = pasteData
        .split(/\r?\n/)
        .filter((row) => row.trim() !== "")
        .map((row) => row.split("\t"));

      if (!activeCell) return;

      setData((old) => {
        const newData = [...old];
        const startRow = activeCell.rowIndex;
        const columnOrder: (keyof TransactionRow)[] = [
          "date",
          "type",
          "category_id",
          "is_fixed",
          "description",
          "amount",
          "remarks",
        ];
        const startColIdx = columnOrder.indexOf(
          activeCell.columnId as keyof TransactionRow,
        );
        if (startColIdx === -1) return old;

        rows.forEach((rowCells, rIdx) => {
          const targetRowIdx = startRow + rIdx;
          if (!newData[targetRowIdx]) {
            newData[targetRowIdx] = createEmptyRow();
          }

          rowCells.forEach((cellValue, cIdx) => {
            const targetColIdx = startColIdx + cIdx;
            if (targetColIdx < columnOrder.length) {
              const colId = columnOrder[targetColIdx];
              let processedValue: any = cellValue;

              if (colId === "amount") {
                processedValue =
                  Number(cellValue.replace(/[^0-9.-]+/g, "")) || "";
              } else if (colId === "type") {
                processedValue = cellValue.includes("수입") ? 0 : 1;
              } else if (colId === "is_fixed") {
                processedValue =
                  cellValue.toUpperCase() === "Y" || cellValue === "1" ? 1 : 0;
              }

              (newData[targetRowIdx] as any)[colId] = processedValue;
            }
          });
        });
        return newData;
      });
    },
    [activeCell, createEmptyRow],
  );

  const handleAddRow = () => setData((prev) => [...prev, createEmptyRow()]);
  const handleDeleteRow = (index: number) => {
    setData((prev) => prev.filter((_, i) => i !== index));
  };

  const columns = useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        size: 40,
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "date",
        header: "날짜",
        size: 130,
        meta: { type: "date" },
        cell: EditableCell,
      },
      {
        accessorKey: "type",
        header: "유형",
        size: 80,
        meta: {
          type: "select",
          options: [
            { label: "수입", value: 0 },
            { label: "지출", value: 1 },
          ],
        },
        cell: EditableCell,
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 140,
        meta: { type: "select" },
        cell: EditableCell,
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: ({ row, column, table }) => (
          <Checkbox
            checked={row.original.is_fixed === 1}
            onCheckedChange={(checked) =>
              (table.options.meta as any).updateData(
                row.index,
                column.id,
                checked ? 1 : 0,
              )
            }
            aria-label="고정 지출 여부"
            className="w-4 h-4"
          />
        ),
      },
      {
        accessorKey: "description",
        header: "설명",
        size: 180,
        cell: EditableCell,
      },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
        cell: EditableCell,
      },
      {
        accessorKey: "remarks",
        header: "메모",
        size: 150,
        cell: EditableCell,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-700 transition-colors"
            onClick={() => handleDeleteRow(row.index)}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
      setActiveCell,
      categories,
    },
  });

  return (
    <div className="p-4 w-full mx-auto" onPaste={handlePaste}>
      <div className="flex justify-between items-center mb-4 bg-slate-800 text-white px-5 py-3 rounded-lg shadow-sm">
        <p className="text-xs font-medium text-slate-300">
          💡 <span className="text-white">Ctrl+V</span>로 엑셀 데이터를
          붙여넣으세요. 날짜와 금액이 필수입니다.
        </p>
        <Button
          onClick={handleAddRow}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" /> 행 추가
        </Button>
      </div>

      <div className="border rounded-md bg-white shadow-sm border-slate-200 overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse table-fixed min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-2 font-bold text-slate-500 border-r border-slate-200 text-center"
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : (header.column.columnDef.header as string)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                {row.getVisibleCells().map((cell) => {
                  const colId = cell.column.id;
                  const isCentered = [
                    "rowNumber",
                    "date",
                    "is_fixed",
                    "actions",
                  ].includes(colId);

                  const isDragSelected =
                    isDragging &&
                    dragStart?.c === colId &&
                    dragEndRow !== null &&
                    ((row.index >= dragStart.r && row.index <= dragEndRow) ||
                      (row.index <= dragStart.r && row.index >= dragEndRow));

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "p-0 border-r border-slate-100 h-8 relative group/cell",
                        isDragSelected &&
                          "bg-blue-100/60 ring-2 ring-inset ring-blue-500/50 z-20",
                      )}
                    >
                      <div
                        className={cn(
                          "w-full h-full",
                          isCentered && "flex items-center justify-center",
                          isDragging && "pointer-events-none",
                        )}
                      >
                        {React.createElement(
                          cell.column.columnDef.cell as any,
                          cell.getContext(),
                        )}
                      </div>
                      {!["rowNumber", "actions"].includes(
                        colId,
                      ) && (
                        <>
                          {isDragging && (
                            <div
                              className="absolute inset-0 z-10"
                              onMouseEnter={() => setDragEndRow(row.index)}
                            />
                          )}
                          <div
                            className="absolute bottom-0 right-0 w-2 h-2 bg-slate-400 cursor-crosshair z-20 opacity-0 group-hover/cell:opacity-100 active:bg-blue-500 border border-white"
                            onMouseDown={() => {
                              setIsDragging(true);
                              setDragStart({ r: row.index, c: colId });
                              setDragEndRow(row.index);
                            }}
                          />
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewTransactions;
