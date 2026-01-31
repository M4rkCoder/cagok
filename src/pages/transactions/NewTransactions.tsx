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
import { Plus, Save, Trash2 } from "lucide-react";
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
import { format, addDays, parseISO, isValid } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// --- 스마트 날짜 파서 ---
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
  const {
    updateData,
    setActiveCell,
    activeCell,
    categories,
    onDragStart,
    batchUpdate,
  } = table.options.meta as any;
  const [value, setValue] = useState(initialValue);
  const [openCombo, setOpenCombo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  // 항목열 활성화 시 즉시 팝업 오픈 및 검색창 포커스
  useEffect(() => {
    if (isActive) {
      if (column.id === "category_id") {
        setOpenCombo(true);
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
        if (e.shiftKey)
          moveNext(row.index, 1); // Shift+Tab: 날짜로
        else moveNext(row.index, row.original.type === 1 ? 3 : 4); // Tab: 고정 또는 설명으로
      } else if (e.shiftKey) {
        const prevCol = colIdx === 1 ? 6 : colIdx - 1;
        const prevRow = colIdx === 1 ? Math.max(0, row.index - 1) : row.index;
        moveNext(prevRow, prevCol);
      } else {
        const nextCol = colIdx === 6 ? 1 : colIdx + 1;
        const nextRow =
          colIdx === 6 ? Math.min(maxRows - 1, row.index + 1) : row.index;
        moveNext(nextRow, nextCol);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), colIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveNext(Math.max(0, row.index - 1), colIdx);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), colIdx);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text");
    const rows = pasteData.split(/\r\n|\n|\r/).map((r) => r.split("\t"));
    if (rows.length > 0) {
      e.preventDefault();
      batchUpdate(row.index, colIdx, rows);
    }
  };

  // --- 항목 열 (Popover + Command) ---
  if (column.id === "category_id") {
    const selected = categories.find((c: any) => c.id === value);
    return (
      <Popover open={openCombo} onOpenChange={setOpenCombo}>
        <PopoverTrigger asChild>
          <button
            ref={comboTriggerRef}
            onKeyDown={handleKeyDown}
            onClick={() => setOpenCombo(true)}
            className={cn(
              "w-full h-full flex items-center px-2 outline-none transition-colors",
              isActive && "bg-blue-50/50"
            )}
          >
            {selected ? (
              <div className="flex items-center gap-2 truncate text-[12px]">
                <Badge
                  variant={selected.type === 0 ? "secondary" : "destructive"}
                  className="h-4 px-1 text-[9px]"
                >
                  {selected.type === 0 ? "수입" : "지출"}
                </Badge>
                <span className="truncate">{selected.name}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-[12px]">선택...</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[220px]"
          align="start"
          onOpenAutoFocus={(e) => {
            /* CommandInput autoFocus 작동을 위해 비워둠 */
          }}
        >
          <Command>
            <CommandInput
              placeholder="검색..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenCombo(false);
                  if (e.shiftKey) moveNext(row.index, 1);
                  else moveNext(row.index, row.original.type === 1 ? 3 : 4);
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

  // --- 일반 입력 열 ---
  return (
    <div className="relative w-full h-full group">
      <Input
        ref={inputRef}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          let f = value;
          if (column.id === "date" && value) f = smartParseDate(value);
          if (initialValue !== f) updateData(row.index, column.id, f);
        }}
        className={cn(
          "w-full h-full bg-transparent border-none focus-visible:ring-0 px-2 text-[13px]",
          (column.columnDef.meta as any)?.type === "number" &&
            "text-right font-mono"
        )}
      />
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
      />
    </div>
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
    Array.from({ length: 15 }, createEmptyRow)
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
    []
  );

  const onDragStart = (
    e: React.MouseEvent,
    startRow: number,
    startCol: number
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
    const baseValue = data[startRow][key as keyof TransactionRow];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const target = moveEvent.target as HTMLElement;
      const cell = target.closest("td");
      if (cell) {
        const tr = cell.parentElement;
        if (tr) {
          const endRow = Array.from(tr.parentElement!.children).indexOf(tr);
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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
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
        size: 160,
        cell: (i) => <EditableCell {...i} colIdx={2} />,
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: ({ row, table }) => {
          const { setActiveCell, activeCell, updateData } = table.options
            .meta as any;
          const isActive =
            activeCell?.rowIndex === row.index && activeCell?.colIdx === 3;
          const cbRef = useRef<HTMLButtonElement>(null);
          useEffect(() => {
            if (isActive) cbRef.current?.focus();
          }, [isActive]);
          return (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center transition-colors",
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
        size: 40,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setData((prev) => prev.filter((_, i) => i !== row.index))
            }
            className="h-8 w-8 text-slate-400 hover:text-red-500"
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
    meta: {
      updateData,
      setActiveCell,
      activeCell,
      categories,
      batchUpdate,
      onDragStart,
    },
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-[1250px] mx-auto space-y-4">
        <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h2 className="font-bold">엑셀형 대량 입력기</h2>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => console.log(data)}
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

export default NewTransactions;
