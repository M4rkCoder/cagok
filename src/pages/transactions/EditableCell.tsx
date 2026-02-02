import { PlusCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import React, { useState, useEffect, useRef } from "react";
import { CellContext } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import CategoryForm from "@/pages/settings/CategoryForm";
import { ExpenseBadge, IncomeBadge } from "./TransactionBadge";
import { useCategoryStore } from "@/store/useCategoryStore";

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

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
}: CellContext<TransactionRow, any> & { colIdx: number }): React.ReactNode => {
  const { submitCategoryForm } = useCategoryStore();
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
      moveNext(Math.min(maxRows - 1, row.index + 1), 1); // Move to the 'date' column (colIdx 1) of the next row
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveNext(Math.max(0, row.index - 1), colIdx);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), colIdx);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveNext(row.index, Math.max(1, colIdx - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveNext(row.index, Math.min(6, colIdx + 1));
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

  // --- 날짜 열 (Popover + Calendar) ---
  if (column.id === "date") {
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
            if (value) f = smartParseDate(value);
            if (initialValue !== f) updateData(row.index, column.id, f);
          }}
          className={cn(
            "w-full h-full bg-transparent border-none focus-visible:ring-0 pr-10 pl-2 text-[13px] rounded-none",
            isActive && "z-20"
          )}
        />
        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <button
              className="absolute right-0 top-0 size-10 z-30 flex items-center justify-center"
              onClick={() => setOpenCombo(true)}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <CalendarIcon className="size-4 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={value ? parseISO(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  updateData(row.index, "date", formattedDate);
                  setValue(formattedDate);
                  setOpenCombo(false);
                  inputRef.current?.focus();
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <div
          onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
        />
      </div>
    );
  }

  // --- 항목 열 (Popover + Command) ---
  if (column.id === "category_id") {
    const selected = categories.find((c: any) => c.id === value);
    const [openSheet, setOpenSheet] = useState(false);

    return (
      <div className="relative w-full h-full group">
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
                <div className="flex items-center gap-1 truncate text-[12px]">
                  {selected.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                  <span>
                    {selected.icon} {selected.name}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-[12px]">선택...</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[170px]"
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
                  } else if (e.key === "ArrowLeft") {
                    e.currentTarget.selectionStart === 0;
                    e.preventDefault();
                    setOpenCombo(false);
                    moveNext(row.index, 1); // 날짜 열로 이동
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setOpenCombo(false);
                    // 지출(type:1)이면 고정열(3), 수입(type:0)이면 설명열(4)로 이동
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
                      <div className="flex items-center gap-1 truncate">
                        {cat.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                        <span>
                          {cat.icon}
                          {cat.name}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpenCombo(false); // Close popover when sheet opens
                    setOpenSheet(true);
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                >
                  <PlusCircle className="size-4" />
                  카테고리 추가
                </CommandItem>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Sheet open={openSheet} onOpenChange={setOpenSheet} modal={false}>
          <SheetTrigger /> {/* This trigger is now a direct child of Sheet */}
          <SheetContent className="top-12 h-[calc(100vh-theme(spacing.12))]">
            <SheetHeader>
              <SheetTitle>새 카테고리 추가</SheetTitle>
              <SheetDescription>
                새로운 카테고리를 만들고 아이콘 및 유형을 지정하세요.
              </SheetDescription>
            </SheetHeader>
            <CategoryForm
              onSubmit={submitCategoryForm}
              onCancel={() => setOpenSheet(false)}
            />
          </SheetContent>
        </Sheet>
        <div
          onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
        />
      </div>
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
          "w-full h-full bg-transparent border-none focus-visible:ring-0 px-2 text-[13px] rounded-none",
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

export default EditableCell;

export type { TransactionRow };
