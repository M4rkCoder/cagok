import { useState, useCallback } from "react";
import { parseISO, addDays, format, isValid } from "date-fns";
import { toast } from "sonner";
import {
  transactionSchema,
  TransactionFormValues,
} from "@/schemas/transaction";
import { QuickEntryTransactionRow } from "@/types";
import { smartParseDate } from "@/lib/utils";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "@/stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

const colKeys = [
  "date",
  "category_id",
  "is_fixed",
  "description",
  "amount",
  "remarks",
];

interface ExcelPreviewRow {
  id: string;
  date: string;
  tx_type: number;
  category_id: string;
  category_name: string;
  is_fixed: number;
  description: string;
  amount: string;
  remarks: string;
  is_valid: boolean;
  error_msg?: string;
}

const isRowFilled = (row: QuickEntryTransactionRow) => {
  return !!(
    row.date ||
    row.description ||
    row.amount ||
    row.category_id ||
    row.remarks
  );
};

export const useQuickEntry = (initialRows = 10, submitForm: any) => {
  const { categoryList } = useAppStore();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

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

      setRowErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        const rowId = data[rowIndex]?.id;
        if (rowId && newErrors[rowId]) {
          delete newErrors[rowId][columnId];
          if (Object.keys(newErrors[rowId]).length === 0)
            delete newErrors[rowId];
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

  const handleSaveAll = useCallback(async () => {
    const { t } = i18n;
    const currentBatchErrors: Record<string, any> = {};
    const transactionsToSubmit: TransactionFormValues[] = [];
    console.log(data);

    const filledData = data.filter((row) => {
      const hasDate = row.date && row.date.trim() !== "";
      const hasDesc = row.description && row.description.trim() !== "";
      const hasAmount = row.amount !== "" && row.amount !== null;
      return hasDate || hasDesc || hasAmount;
    });

    if (filledData.length === 0) {
      toast.info(t("quick_entry.toasts.no_data"));
      return;
    }

    for (const row of filledData) {
      let parsedAmount = 0;
      if (typeof row.amount === "string") {
        parsedAmount = parseFloat(row.amount.replace(/,/g, "")) || 0;
      } else {
        parsedAmount = Number(row.amount) || 0;
      }

      const parsedCategoryId = parseInt(row.category_id);

      const transactionToValidate = {
        type:
          row.type !== undefined && row.type !== null ? Number(row.type) : 1,
        is_fixed: Number(row.is_fixed) || 0,
        amount: parsedAmount,
        date: row.date,
        description: row.description || "",
        remarks: row.remarks || "",
        category_id:
          isNaN(parsedCategoryId) || parsedCategoryId === 0
            ? null
            : parsedCategoryId,
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

    // 에러가 있다면 중단
    if (Object.keys(currentBatchErrors).length > 0) {
      setRowErrors(currentBatchErrors);
      toast.error(t("quick_entry.toasts.error_in_input"));
      return;
    }

    // 벡엔드 전송
    if (transactionsToSubmit.length > 0) {
      const loadingId = toast.loading(
        t("quick_entry.toasts.saving_count", {
          count: transactionsToSubmit.length,
        })
      );
      try {
        await invoke("bulk_create_transactions", {
          transactions: transactionsToSubmit,
        });

        toast.dismiss(loadingId);
        toast.success(t("quick_entry.toasts.save_success"));

        // 저장 후 테이블 초기화
        setData(Array.from({ length: initialRows }, createEmptyRow));
        setRowErrors({});
      } catch (error) {
        toast.dismiss(loadingId);
        toast.error(t("quick_entry.toasts.save_failed", { error }));
      }
    }
  }, [data, invoke, i18n]);

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

  const handleDownloadTemplate = async () => {
    const { t } = i18n;
    try {
      // 1. 파일 저장 다이얼로그 (확장자를 xlsx로 변경)
      const filePath = await save({
        defaultPath: "template.xlsx",
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (!filePath) return;

      await invoke("generate_excel_template", {
        filePath,
        lang: i18n.language.startsWith("ko") ? "ko" : "en",
      });

      toast.success(t("quick_entry.toasts.template_saved"));
    } catch (err) {
      console.error(err);
      toast.error(t("quick_entry.toasts.template_error"));
    }
  };

  const handleImportFile = async () => {
    const { t } = i18n;
    try {
      const selected = await open({
        filters: [
          { name: "Transaction Files", extensions: ["xlsx", "xls", "csv"] },
        ],
      });

      if (!selected || typeof selected !== "string") return;

      setIsLoading(true);

      const previewData = await invoke<ExcelPreviewRow[]>(
        "parse_transaction_file",
        { path: selected }
      );

      // 3. UI 데이터 업데이트
      setData((prev) => {
        const existingFilled = prev.filter(isRowFilled);
        const mappedNewRows: QuickEntryTransactionRow[] = previewData.map(
          (row) => ({
            id: row.id,
            date: smartParseDate(row.date),
            type: row.tx_type, // 0: 수입, 1: 지출
            category_id: row.category_id,
            is_fixed: row.is_fixed, // 0: 변동, 1: 고정
            description: row.description,
            amount: row.amount,
            remarks: row.remarks,
            is_valid: row.is_valid,
            error_msg: row.error_msg,
          })
        );

        return [...existingFilled, ...mappedNewRows];
      });

      // 4. 결과 알림
      const invalidCount = previewData.filter((r) => !r.is_valid).length;
      if (invalidCount > 0) {
        toast.warning(
          t("quick_entry.toasts.import_check_required", { count: invalidCount })
        );
      } else {
        toast.success(
          t("quick_entry.toasts.import_success", { count: previewData.length })
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t("quick_entry.toasts.import_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    setData,
    isLoading,
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
    handleDownloadTemplate,
    handleImportFile,
  };
};
