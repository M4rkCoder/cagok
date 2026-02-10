import React, { useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { QuickEntryTransactionRow } from "@/types";
import { CellContext } from "@tanstack/react-table";
import { useTableNavigation } from "../hooks/useTableNavigation";

interface FixedCheckboxCellProps extends CellContext<
  QuickEntryTransactionRow,
  any
> {
  colIdx: number;
  onPaste?: (e: React.ClipboardEvent, r: number, c: number) => void;
}

const FixedCheckboxCell: React.FC<FixedCheckboxCellProps> = ({
  row,
  column,
  table,
  colIdx,
}) => {
  const { setActiveCell, activeCell, updateData, onDragStart } = table.options
    .meta as any;

  const { handleTableKeyDown } = useTableNavigation(table, setActiveCell);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;
  const cbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) cbRef.current?.focus();
  }, [isActive]);

  return (
    <div className="relative w-full h-full group">
      <div
        className={cn(
          "w-full h-full flex items-center justify-center transition-colors",
          isActive && "bg-blue-100/50"
        )}
      >
        <Checkbox
          ref={cbRef}
          checked={row.original.is_fixed === 1}
          disabled={row.original.type === 0} // 지출/수입 타입에 따른 비활성화 로직
          onCheckedChange={(c) => updateData(row.index, "is_fixed", c ? 1 : 0)}
          onFocus={() => setActiveCell({ rowIndex: row.index, colIdx })}
          onKeyDown={(e) =>
            handleTableKeyDown(
              e,
              row.index,
              colIdx,
              column.id,
              row.original.type
            )
          }
          className={cn(isActive && "ring-2 ring-blue-500")}
        />
      </div>

      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
      />
    </div>
  );
};

export default FixedCheckboxCell;
