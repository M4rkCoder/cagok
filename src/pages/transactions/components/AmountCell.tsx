import React, { useState, useEffect, useRef } from "react";
import { cn, evaluateExpression } from "@/lib/utils";
import { CellProps } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTableNavigation } from "@/pages/transactions/hooks/useTableNavigation";
import { useTranslation } from "react-i18next";

export const AmountCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
  onPaste,
  error,
}: CellProps) => {
  const { t } = useTranslation();
  const initialValue = getValue();
  const { setActiveCell, activeCell, onDragStart, confirmUpdate } = table
    .options.meta as any;
  const { handleTableKeyDown } = useTableNavigation(table, setActiveCell);

  // 초기값 표시 시에도 콤마를 찍어서 시작
  const formatWithComma = (val: any) => {
    if (!val && val !== 0) return "";
    const num = String(val).replace(/,/g, "");
    return isNaN(Number(num)) ? num : Number(num).toLocaleString();
  };

  const [value, setValue] = useState(() => formatWithComma(initialValue));
  const [preview, setPreview] = useState("");
  const [showErrorVisuals, setShowErrorVisuals] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  // 외부 데이터 변경 시 콤마 포함해서 업데이트
  useEffect(() => setValue(formatWithComma(initialValue)), [initialValue]);

  useEffect(() => {
    const stringValue = String(value || "").replace(/,/g, "");
    const hasOperator = /[+\-*/]/.test(stringValue);

    if (hasOperator) {
      const result = evaluateExpression(stringValue);
      if (result && result !== stringValue) {
        setPreview(Number(result).toLocaleString());
      } else {
        setPreview("");
      }
    } else {
      setPreview("");
    }
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  useEffect(() => {
    if (error && error.message && error.timestamp) {
      setShowErrorVisuals(true);
      const timer = setTimeout(() => {
        setShowErrorVisuals(false);
      }, 2000); // 2 second
      return () => clearTimeout(timer);
    } else {
      setShowErrorVisuals(false);
    }
  }, [error]);

  const handleBlur = () => {
    // 1. 계산 전 콤마 제거
    const rawValue = String(value || "").replace(/,/g, "");
    const calculatedValue = evaluateExpression(rawValue);

    // 2. 부모에게는 콤마 없는 순수 숫자 값 전달 (DB 저장용)
    confirmUpdate(row.index, column.id, calculatedValue, initialValue);

    // 3. 화면에는 다시 콤마를 찍어서 표시
    setValue(formatWithComma(calculatedValue));
    setPreview("");
  };

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center bg-transparent group"
      onPaste={(e) => onPaste(e, row.index, colIdx)}
    >
      <Tooltip open={isActive && preview !== ""}>
        <TooltipTrigger asChild>
          <div className="relative flex items-center h-full">
            <input
              ref={inputRef}
              // 입력 중에도 사용자가 콤마를 직접 칠 수 있으므로 value 그대로 사용
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
              placeholder="0"
              className={cn(
                "w-full h-full bg-transparent border-none focus-visible:ring-0 px-2 text-sm text-right font-mono font-semibold",
                showErrorVisuals && "border-red-500 outline-2 outline-red-500"
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs font-sans px-2 py-1 bg-blue-600 text-white"
        >
          {t("transaction_form.calculation_result", { amount: preview })}
        </TooltipContent>
      </Tooltip>
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
      />
    </div>
  );
};
