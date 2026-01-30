import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash2, Info } from "lucide-react";
import { useHeaderStore } from "@/store/useHeaderStore";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

// --- Editable Cell 컴포넌트 ---
const EditableCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const { updateData, setActiveCell } = table.options.meta;

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

  const columnType = column.columnDef.meta?.type;

  if (columnType === "select") {
    return (
      <select
        value={value ?? ""}
        onFocus={onFocus}
        onChange={(e) => updateData(row.index, column.id, e.target.value)}
        className="w-full h-full bg-transparent outline-none cursor-pointer px-1 text-[13px]"
      >
        <option value="">선택</option>
        {column.columnDef.meta?.options?.map((opt: any) => {
          // label이 있으면 label을, 없으면 name을 사용 (유형/항목 공통 대응)
          const displayName = opt.label || opt.name;
          const displayValue = opt.value !== undefined ? opt.value : opt.id;

          return (
            <option key={displayValue} value={displayValue}>
              {opt.icon ? `${opt.icon} ${displayName}` : displayName}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <input
      type={
        columnType === "number"
          ? "number"
          : columnType === "date"
            ? "date"
            : "text"
      }
      value={value ?? ""}
      onFocus={onFocus}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      placeholder={columnType === "date" ? "" : "입력..."}
      className="w-full h-full bg-transparent px-2 outline-none focus:bg-blue-50/50 transition-all"
    />
  );
};

const NewTransactions: React.FC = () => {
  const { t } = useTranslation();
  const { categories } = useAppStore();
  const { setHeader, resetHeader } = useHeaderStore();

  const createEmptyRow = () => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    date: "",
    type: 1,
    category_id: "",
    is_fixed: 0,
    description: "",
    amount: "",
    remarks: "",
  });

  const [data, setData] = useState<any[]>(() =>
    Array.from({ length: 20 }, createEmptyRow)
  );
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ r: number; c: string } | null>(
    null
  );
  const [dragEndRow, setDragEndRow] = useState<number | null>(null);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEndRow !== null) {
      const sourceValue = data[dragStart.r][dragStart.c];
      const start = Math.min(dragStart.r, dragEndRow);
      const end = Math.max(dragStart.r, dragEndRow);

      setData((old) =>
        old.map((row, idx) => {
          if (idx >= start && idx <= end) {
            return { ...row, [dragStart.c]: sourceValue };
          }
          return row;
        })
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

  useEffect(() => {
    setHeader(
      "대량 입력 모드",
      <Button
        onClick={handleSaveAll}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="w-4 h-4 mr-2" /> 저장
      </Button>
    );
    return () => resetHeader();
  }, [data]);

  const updateData = (rowIndex: number, columnId: string, value: any) => {
    setData((old) =>
      old.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  // 2. 엑셀 붙여넣기 고도화 (현재 선택된 셀 기준)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasteData = e.clipboardData.getData("text");
      const rows = pasteData
        .split(/\r?\n/)
        .filter((row) => row.trim() !== "")
        .map((row) => row.split("\t"));

      if (!activeCell) return;

      setData((old) => {
        const newData = [...old];
        const startRow = activeCell.rowIndex;
        const columnOrder = [
          "date",
          "type",
          "category_id",
          "is_fixed",
          "description",
          "amount",
          "remarks",
        ];
        const startColIdx = columnOrder.indexOf(activeCell.columnId);

        rows.forEach((rowCells, rIdx) => {
          const targetRowIdx = startRow + rIdx;
          if (!newData[targetRowIdx]) newData[targetRowIdx] = createEmptyRow();

          rowCells.forEach((cellValue, cIdx) => {
            const targetColIdx = startColIdx + cIdx;
            if (targetColIdx < columnOrder.length) {
              const colId = columnOrder[targetColIdx];
              let processedValue: any = cellValue;

              if (colId === "amount")
                processedValue = Number(cellValue.replace(/[^0-9.-]+/g, ""));
              if (colId === "type")
                processedValue = cellValue.includes("수입") ? 0 : 1;
              if (colId === "is_fixed")
                processedValue = cellValue.toUpperCase() === "Y" ? 1 : 0;

              newData[targetRowIdx][colId] = processedValue;
            }
          });
        });
        return newData;
      });
    },
    [activeCell]
  );

  const handleAddRow = () => setData((prev) => [...prev, createEmptyRow()]);

  const handleSaveAll = () => {
    // 3. 유효 데이터 필터링 (날짜와 금액이 있는 것만)
    const validData = data.filter((row) => row.date && row.amount);
    console.log("DB로 전송될 유효 데이터:", validData);
    alert(`${validData.length}건의 데이터가 준비되었습니다.`);
  };

  // [기능 추가] 행 삭제 핸들러
  const handleDeleteRow = (index: number) => {
    setData((prev) => prev.filter((_, i) => i !== index));
  };

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const baseColumns: ColumnDef<any>[] = [
      {
        id: "rowNumber",
        header: "#",
        size: 40,
        cell: ({ row }) => (
          <span className="text-slate-400 text-[10px]">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "date",
        header: "날짜",
        size: 130,
        meta: { type: "date" },
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
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 140,
        meta: { type: "select", options: categories },
      },
      { accessorKey: "is_fixed", header: "고정", size: 50 },
      { accessorKey: "description", header: "설명", size: 180 },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
      },
      { accessorKey: "remarks", header: "메모", size: 150 },
      {
        id: "actions",
        header: "",
        size: 50,
      },
    ];

    return baseColumns.map((col) => {
      const colId = col.id || (col as any).accessorKey;

      return {
        ...col,
        id: colId, // 명시적으로 ID 부여
        cell: (info: any) => {
          const isRowNumber = colId === "rowNumber"; // 번호 열인지 확인
          const isFixed = colId === "is_fixed";
          const isActions = colId === "actions";
          const canDrag = !isRowNumber && !isActions;

          return (
            <div className="relative w-full h-full group/cell">
              {/* 실제 셀 내용 */}
              <div
                className={cn(
                  "w-full h-full",
                  isDragging && "pointer-events-none"
                )}
              >
                {isRowNumber ? (
                  <span className="text-slate-400 text-[10px]">
                    {info.row.index + 1}
                  </span>
                ) : isActions ? (
                  // [해결] 삭제 버튼 렌더링
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => handleDeleteRow(info.row.index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                ) : isFixed ? (
                  <input
                    type="checkbox"
                    checked={info.row.original.is_fixed === 1}
                    onChange={(e) =>
                      updateData(
                        info.row.index,
                        colId,
                        e.target.checked ? 1 : 0
                      )
                    }
                    className="w-3 h-3 cursor-pointer accent-blue-600"
                  />
                ) : (
                  <EditableCell {...info} />
                )}
              </div>

              {/* 드래그 감지 레이어 (입력 가능 셀에만 적용) */}
              {isDragging && canDrag && (
                <div
                  className="absolute inset-0 z-10 pointer-events-auto"
                  onMouseEnter={() => setDragEndRow(info.row.index)}
                />
              )}

              {/* 드래그 핸들 (입력 가능 셀에만 적용) */}
              {canDrag && (
                <div
                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair z-30 opacity-0 group-hover/cell:opacity-100 border border-white"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                    setDragStart({ r: info.row.index, c: colId });
                    setDragEndRow(info.row.index);
                  }}
                />
              )}
            </div>
          );
        },
      };
    });
  }, [isDragging, categories, data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { updateData, setActiveCell } as any,
  });

  return (
    <div className="p-4 w-full mx-auto overflow-hidden" onPaste={handlePaste}>
      {/* 상단 안내 바 컴팩트화 */}
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
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50 border-b border-slate-200"
              >
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
                  const currentId = cell.column.id;

                  // 드래그 선택 여부 판단 로직
                  const isDragSelected =
                    isDragging &&
                    dragStart?.c === currentId &&
                    ((row.index >= dragStart.r &&
                      row.index <= (dragEndRow ?? dragStart.r)) ||
                      (row.index <= dragStart.r &&
                        row.index >= (dragEndRow ?? dragStart.r)));

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "p-0 border-r border-slate-100 h-8 transition-all relative",
                        isDragSelected &&
                          "bg-blue-100/60 ring-2 ring-inset ring-blue-500/50 z-20"
                      )}
                    >
                      {React.createElement(
                        cell.column.columnDef.cell as any,
                        cell.getContext()
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
