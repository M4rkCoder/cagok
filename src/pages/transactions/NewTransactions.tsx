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
  CellContext,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Trash2, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// --- 스마트 날짜 파서 (기존 로직 유지) ---
const smartParseDate = (input: string): string => {
  if (!input) return "";
  const today = new Date();
  const year = today.getFullYear();
  const clean = input.replace(/[^0-9]/g, "");
  let res: Date;
  if (clean.length === 8)
    res = new Date(
      parseInt(clean.slice(0, 4)),
      parseInt(clean.slice(4, 6)) - 1,
      parseInt(clean.slice(6, 8))
    );
  else if (clean.length === 4)
    res = new Date(
      year,
      parseInt(clean.slice(0, 2)) - 1,
      parseInt(clean.slice(2, 4))
    );
  else if (clean.length === 2 || clean.length === 1)
    res = new Date(year, today.getMonth(), parseInt(clean));
  else {
    const p = input.split(/[-./]/);
    if (p.length === 3)
      res = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    else return input;
  }
  return isNaN(res.getTime()) ? input : format(res, "yyyy-MM-dd");
};

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

const EditableCell: React.FC<
  CellContext<TransactionRow, any> & { colIdx: number }
> = ({ getValue, row, column, table, colIdx }) => {
  const initialValue = getValue();
  const { updateData, setActiveCell, activeCell, categories } = table.options
    .meta as any;
  const [value, setValue] = useState(initialValue);
  const [openCombo, setOpenCombo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  useEffect(() => {
    if (isActive) {
      if (column.id === "category_id") {
        setOpenCombo(true);
        comboTriggerRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    } else {
      setOpenCombo(false);
    }
  }, [isActive, column.id]);

  const moveNext = (r: number, c: number) =>
    setActiveCell({ rowIndex: r, colIdx: c });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const maxRows = table.getRowModel().rows.length;
    if (e.key === "Tab") {
      e.preventDefault();
      if (column.id === "category_id") {
        moveNext(row.index, row.original.type === 1 ? 3 : 4);
      } else if (e.shiftKey) {
        moveNext(
          colIdx === 1 ? Math.max(0, row.index - 1) : row.index,
          colIdx === 1 ? 6 : colIdx - 1
        );
      } else {
        moveNext(
          colIdx === 6 ? Math.min(maxRows - 1, row.index + 1) : row.index,
          colIdx === 6 ? 1 : colIdx + 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), 1);
    } else if (e.key === "ArrowUp")
      moveNext(Math.max(0, row.index - 1), colIdx);
    else if (e.key === "ArrowDown")
      moveNext(Math.min(maxRows - 1, row.index + 1), colIdx);
  };

  if (column.id === "category_id") {
    const selected = categories.find((c: any) => c.id === value);
    return (
      <Popover open={openCombo} onOpenChange={setOpenCombo}>
        <PopoverTrigger asChild>
          <button
            ref={comboTriggerRef}
            onClick={() => setOpenCombo(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full h-full flex items-center px-2 outline-none",
              isActive && "bg-blue-50/50"
            )}
          >
            {selected ? (
              <div className="flex items-center gap-2 truncate text-[13px]">
                <Badge
                  variant={selected.type === 0 ? "secondary" : "destructive"}
                  className="h-4 px-1 text-[10px]"
                >
                  {selected.type === 0 ? "수입" : "지출"}
                </Badge>
                <span className="truncate">{selected.name}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-[13px]">항목 선택...</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[220px]" align="start">
          <Command>
            <CommandInput
              placeholder="검색..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  setOpenCombo(false);
                  moveNext(row.index, row.original.type === 1 ? 3 : 4);
                }
              }}
            />
            <CommandList>
              <CommandEmpty>결과 없음</CommandEmpty>
              <CommandGroup>
                {categories.map((cat: any) => (
                  <CommandItem
                    key={cat.id}
                    onSelect={() => {
                      updateData(row.index, "category_id", cat.id);
                      updateData(row.index, "type", cat.type);
                      setOpenCombo(false);
                      setTimeout(
                        () => moveNext(row.index, cat.type === 1 ? 3 : 4),
                        50
                      );
                    }}
                  >
                    <Badge
                      variant={cat.type === 0 ? "secondary" : "destructive"}
                      className="mr-2"
                    >
                      {cat.type === 0 ? "수입" : "지출"}
                    </Badge>
                    {cat.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={value ?? ""}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        let f = value;
        if (column.id === "date" && value) f = smartParseDate(value);
        if (initialValue !== f) updateData(row.index, column.id, f);
      }}
      onFocus={() => setActiveCell({ rowIndex: row.index, colIdx })}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full h-8 bg-transparent border-none focus-visible:ring-0 px-2 text-[13px]",
        (column.columnDef.meta as any)?.type === "number" &&
          "text-right font-mono"
      )}
    />
  );
};

const NewTransactions: React.FC = () => {
  const { categories } = useAppStore();
  const createEmptyRow = () => ({
    id: crypto.randomUUID(),
    date: "",
    type: 1,
    category_id: "",
    is_fixed: 0,
    description: "",
    amount: "",
    remarks: "",
  });
  const [data, setData] = useState<TransactionRow[]>(() =>
    Array.from({ length: 5 }, createEmptyRow)
  );
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    colIdx: number;
  } | null>(null);

  const updateData = useCallback((r: number, cid: string, val: any) => {
    setData((prev) =>
      prev.map((row, i) => (i === r ? { ...row, [cid]: val } : row))
    );
  }, []);

  const addRow = () => {
    setData((prev) => [...prev, createEmptyRow()]);
    setTimeout(() => setActiveCell({ rowIndex: data.length, colIdx: 1 }), 50);
  };

  const removeRow = (index: number) => {
    setData((prev) => prev.filter((_, i) => i !== index));
    setActiveCell(null);
  };

  const columns = useMemo<ColumnDef<TransactionRow>[]>(
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
        cell: (i) => <EditableCell {...i} colIdx={1} />,
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 180,
        cell: (i) => <EditableCell {...i} colIdx={2} />,
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: ({ row, table }) => {
          const isActive =
            (table.options.meta as any).activeCell?.rowIndex === row.index &&
            (table.options.meta as any).activeCell?.colIdx === 3;
          const cbRef = useRef<HTMLButtonElement>(null);
          useEffect(() => {
            if (isActive) cbRef.current?.focus();
          }, [isActive]);
          return (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center",
                isActive && "bg-blue-100/50"
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
                    (table.options.meta as any).setActiveCell({
                      rowIndex: row.index,
                      colIdx: 4,
                    });
                  }
                }}
                className={cn(isActive && "ring-2 ring-blue-500")}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "설명",
        size: 180,
        cell: (i) => <EditableCell {...i} colIdx={4} />,
      },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
        cell: (i) => <EditableCell {...i} colIdx={5} />,
      },
      {
        accessorKey: "remarks",
        header: "메모",
        size: 150,
        cell: (i) => <EditableCell {...i} colIdx={6} />,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRow(row.index)}
            className="h-8 w-8 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </Button>
        ),
      },
    ],
    [updateData, data.length]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { updateData, setActiveCell, activeCell, categories },
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-4">
        <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h2 className="font-bold tracking-tight">대량 입력 모드</h2>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => console.log(data)}
          >
            <Save size={16} className="mr-2" />
            저장하기
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-[13px] border-collapse table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 border-r border-slate-200 text-slate-500 font-bold text-xs uppercase"
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
                  {row.getVisibleCells().map((cell, idx) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "p-0 border-r border-slate-100 relative h-10",
                        activeCell?.rowIndex === row.index &&
                          activeCell?.colIdx === idx &&
                          "shadow-[inset_0_0_0_2px_#3b82f6] z-10"
                      )}
                    >
                      {React.createElement(
                        cell.column.columnDef.cell as any,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addRow}
            className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all border-t border-dashed"
          >
            <Plus size={16} />
            <span className="font-medium text-sm">새로운 행 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTransactions;
