import React, { useState, useEffect, useRef } from "react";
import { CellContext } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn, smartParseDate } from "@/lib/utils";
import { CellProps } from "@/types";
import { useTableNavigation } from "@/pages/transactions/hooks/useTableNavigation";
import { useSettingStore } from "@/stores/useSettingStore";

import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const DateCell: React.FC<CellProps> = ({
  getValue,
  row,
  column,
  table,
  colIdx,
  onPaste,
  error,
}) => {
  const { i18n } = useTranslation();
  const { dateFormat } = useSettingStore();
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [openCombo, setOpenCombo] = useState(false);
  const [showErrorVisuals, setShowErrorVisuals] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateData, setActiveCell, activeCell, onDragStart, confirmUpdate } =
    table.options.meta as any;
  const { handleTableKeyDown } = useTableNavigation(table, setActiveCell);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  // 에러 발생 시 시각적 효과
  useEffect(() => {
    if (error?.message) {
      setShowErrorVisuals(true);
      const timer = setTimeout(() => setShowErrorVisuals(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    handleTableKeyDown(e, row.index, colIdx, column.id, row.original.type ?? 1);
  };

  const handleBlur = () => {
    confirmUpdate(row.index, column.id, value, initialValue);
  };

  const localeObj = i18n.language === "ko" ? ko : enUS;
  let displayValue = value ?? "";
  if (!isActive && value) {
    try {
      const parsedDate = parseISO(value);
      if (!isNaN(parsedDate.getTime())) {
        displayValue = format(parsedDate, dateFormat, { locale: localeObj });
      }
    } catch (e) {
      // 파싱 실패 시 원본 표시
    }
  }

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center bg-transparent group"
      onPaste={(e) => onPaste(e, row.index, colIdx)}
    >
      <div className="relative flex items-center h-full">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          className={cn(
            "w-full h-full bg-transparent border-none focus-visible:ring-0 pr-10 pl-2 text-sm rounded-none",
            isActive && "z-20 bg-blue-50/50",
            showErrorVisuals && "border-red-500 outline-2 outline-red-500"
          )}
        />
        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <button
              className="absolute right-0 top-0 size-10 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setOpenCombo(true)}
              tabIndex={-1}
            >
              <CalendarIcon className="size-4 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              locale={i18n.language === "ko" ? ko : undefined}
              selected={value ? parseISO(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  updateData(row.index, column.id, formattedDate);
                  setValue(formattedDate);
                  setOpenCombo(false);
                  inputRef.current?.focus();
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 드래그 핸들 */}
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
      />
    </div>
  );
};

export default DateCell;
