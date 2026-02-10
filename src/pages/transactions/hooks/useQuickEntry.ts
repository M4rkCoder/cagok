// hooks/useQuickEntry.ts
import { useState, useCallback } from "react";
import { parseISO, addDays, format, isValid } from "date-fns";
import { toast } from "sonner";
import {
  transactionSchema,
  TransactionFormValues,
} from "@/schemas/transaction";
import { QuickEntryTransactionRow } from "@/types";
import { smartParseDate } from "@/lib/utils";

const colKeys = [
  "date",
  "category_id",
  "is_fixed",
  "description",
  "amount",
  "remarks",
];

export const useQuickEntry = (initialRows = 10, submitForm: any) => {
  const createEmptyRow = (): QuickEntryTransactionRow => ({
    id: crypto.randomUUID(),
    date: "",
    type: 1,
    category_id: "",
    is_fixed: 0,
    description: "",
    amount: "",
    remarks: "",
  });

  const [data, setData] = useState<QuickEntryTransactionRow[]>(() =>
    Array.from({ length: initialRows }, createEmptyRow)
  );
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    colIdx: number;
  } | null>(null);
  const [dragRange, setDragRange] = useState<{
    start: number;
    end: number;
    colIdx: number;
  } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, any>>({});

  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setData((prev) =>
        prev.map((row, i) =>
          i === rowIndex ? { ...row, [columnId]: value } : row
        )
      );
      setRowErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[data[rowIndex].id]) {
          delete newErrors[data[rowIndex].id][columnId];
          if (Object.keys(newErrors[data[rowIndex].id]).length === 0) {
            delete newErrors[data[rowIndex].id];
          }
        }
        return newErrors;
      });
    },
    [data]
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
    const baseValue = data[startRow][key as keyof QuickEntryTransactionRow];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const target = moveEvent.target as HTMLElement;
      const cell = target.closest("td");
      if (!cell) return;
      const tr = cell.parentElement;
      if (!tr) return;

      const endRow = Array.from(tr.parentElement!.children).indexOf(tr);
      setDragRange({ start: startRow, end: endRow, colIdx: startCol });

      if (endRow > startRow) {
        setData((prev) => {
          const next = [...prev];
          for (let i = startRow + 1; i <= endRow; i++) {
            let newVal = baseValue;
            if (key === "date" && typeof baseValue === "string" && baseValue) {
              const d = parseISO(baseValue);
              if (isValid(d))
                newVal = format(addDays(d, i - startRow), "yyyy-MM-dd");
            }
            next[i] = { ...next[i], [key]: newVal };
          }
          return next;
        });
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
        row.category_id
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

  const batchUpdate = useCallback(
    (startRow: number, startCol: number, rows: string[][]) => {
      setData((prev) => {
        let newData = [...prev];
        const totalRowsNeeded = startRow + rows.length;

        if (totalRowsNeeded > newData.length) {
          const rowsToAdd = totalRowsNeeded - newData.length;
          const newEmptyRows = Array.from(
            { length: rowsToAdd },
            createEmptyRow
          );
          newData = [...newData, ...newEmptyRows];
        }

        rows.forEach((rowData, i) => {
          const tRow = startRow + i;

          rowData.forEach((val, j) => {
            const tColIdx = startCol - 1 + j; // colIdx가 1부터 시작한다고 가정

            if (tColIdx >= 0 && tColIdx < colKeys.length) {
              const key = colKeys[tColIdx];
              let finalValue = val.trim();

              if (key === "amount") {
                finalValue = finalValue.replace(/,/g, "");
              }

              newData[tRow] = {
                ...newData[tRow],
                [key]: finalValue,
              };
            }
          });
        });

        return newData;
      });
    },
    [createEmptyRow]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, rowIndex: number, colIdx: number) => {
      const pasteData = e.clipboardData.getData("text");
      if (!pasteData) return;

      // 엑셀/구글시트 등 탭 구분 데이터 파싱
      const rows = pasteData
        .split(/\r\n|\n|\r/)
        .filter((line) => line.trim() !== "") // 빈 줄 제외
        .map((r) => r.split("\t"));

      if (rows.length > 0) {
        e.preventDefault();
        batchUpdate(rowIndex, colIdx, rows);
      }
    },
    [batchUpdate]
  );
  const confirmUpdate = useCallback(
    (rowIndex: number, columnId: string, value: any, initialValue: any) => {
      if (value === initialValue) return;

      let finalValue = value;
      if (columnId === "date" && value) {
        finalValue = smartParseDate(value);
      }

      // 3. 데이터 업데이트
      updateData(rowIndex, columnId, finalValue);
    },
    [updateData]
  );

  return {
    data,
    setData,
    activeCell,
    setActiveCell,
    dragRange,
    rowErrors,
    updateData,
    onDragStart,
    handleSaveAll,
    batchUpdate,
    handlePaste,
    confirmUpdate,
    createEmptyRow,
  };
};
