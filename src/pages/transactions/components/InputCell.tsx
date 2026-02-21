import React, { useState, useEffect, useRef } from "react";
import { cn, smartParseDate } from "@/lib/utils";
import { CellProps } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTableNavigation } from "@/pages/transactions/hooks/useTableNavigation";

export const InputCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
  onPaste,
  error,
}: CellProps) => {
  const initialValue = getValue();
  const {
    updateData,
    setActiveCell,
    activeCell,
    onDragStart,
    batchUpdate,
    confirmUpdate,
  } = table.options.meta as any;
  const { handleTableKeyDown } = useTableNavigation(table, setActiveCell);

  const [value, setValue] = useState(initialValue);
  const [showErrorVisuals, setShowErrorVisuals] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    if (error?.message) {
      setShowErrorVisuals(true);
      const timer = setTimeout(() => setShowErrorVisuals(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  const handleBlur = () => {
    confirmUpdate(row.index, column.id, value, initialValue);
  };

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center bg-transparent group"
      onPaste={(e) => onPaste(e, row.index, colIdx)}
    >
      <div className="relative flex items-center h-full">
        <input
          ref={inputRef}
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) =>
            handleTableKeyDown(
              e,
              row.index,
              colIdx,
              column.id,
              row.original.type ?? 1
            )
          }
          onBlur={handleBlur}
          className={cn(
            "w-full h-full bg-transparent border-none focus-visible:ring-0 px-2 text-[13px]",
            (column.columnDef.meta as any)?.type === "number" &&
              "text-right font-mono",
            showErrorVisuals && "border-red-500 outline-2 outline-red-500"
          )}
        />
      </div>
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
      />
    </div>
  );
};
