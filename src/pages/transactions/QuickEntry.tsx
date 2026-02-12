import React, { useEffect, useMemo } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Save, Upload, Download } from "lucide-react"; // Added Icons
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/store/useTransactionStore";
import { QuickEntryTransactionRow } from "@/types";
import { useQuickEntry } from "./hooks/useQuickEntry";
import FixedCheckboxCell from "./components/FixedCheckboxCell";
import DateCell from "./components/DateCell";
import { InputCell } from "./components/InputCell";
import CategoryCell from "./components/CategoryCell";
import { AmountCell } from "./components/AmountCell";
import { useHeaderStore } from "@/store/useHeaderStore";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, readFile } from "@tauri-apps/plugin-fs";
import Papa from "papaparse";
import { toast } from "sonner";

interface CsvRow {
  date: string;
  type: string;
  category: string;
  amount: string;
  is_fixed: string;
  description: string;
  remarks: string;
}

const QuickEntry: React.FC = () => {
  const { categories } = useAppStore();
  const { submitForm } = useTransactionStore();
  const { setHeader, resetHeader } = useHeaderStore();

  const {
    data,
    setData,
    activeCell,
    setActiveCell,
    dragRange,
    rowErrors,
    updateData,
    onDragStart,
    handleSaveAll,
    createEmptyRow,
    handlePaste,
    batchUpdate,
    confirmUpdate,
  } = useQuickEntry(10, submitForm);

  useEffect(() => {
    setHeader("빠른 입력");
    return () => resetHeader();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const suggestedName = "transactions_template.csv";
      const filePath = await save({
        defaultPath: suggestedName,
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      });

      if (!filePath) return;

      const template =
        "date,type,category,amount,is_fixed,description,remarks\n" +
        "2024-01-01,expense,식비,15000,false,점심 식사,팀 회식";

      // BOM for Excel compatibility (UTF-8 with BOM)
      const bom = "\uFEFF";
      await writeTextFile(filePath, bom + template);

      toast.success("템플릿이 저장되었습니다.");
    } catch (err) {
      console.error(err);
      toast.error("템플릿 저장 실패");
    }
  };

  const handleCsvUpload = async () => {
    try {
      const selected = await open({
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      });

      if (!selected || typeof selected !== "string") return;

      // 바이너리로 파일 읽기
      const bytes = await readFile(selected);
      let text = "";

      // 인코딩 탐지 및 디코딩 (UTF-8 시도 -> 실패 시 EUC-KR)
      try {
        const decoder = new TextDecoder("utf-8", { fatal: true });
        text = decoder.decode(bytes);
      } catch (e) {
        console.warn("UTF-8 decoding failed, trying EUC-KR", e);
        const decoder = new TextDecoder("euc-kr");
        text = decoder.decode(bytes);
      }

      const result = Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        console.error(result.errors);
        toast.error("CSV 파싱 중 오류가 발생했습니다. (인코딩 또는 포맷 확인)");
      }

      const newRows: QuickEntryTransactionRow[] = result.data.map((row: any) => {
        const r = row;
        // 한글/영문 컬럼 매핑
        const date = r.date || r.날짜;
        const typeRaw = r.type || r.구분 || r.유형;
        const categoryRaw = r.category || r.카테고리 || r.항목;
        const amountRaw = r.amount || r.금액;
        const fixedRaw = r.is_fixed || r.고정 || r.고정여부;
        const descRaw = r.description || r.내용 || r.내역 || r.상세내역;
        const remarksRaw = r.remarks || r.메모 || r.비고;

        // 카테고리 이름으로 ID 찾기 (공백 제거)
        const categoryName = categoryRaw?.trim();
        const foundCategory = categories.find((c) => c.name === categoryName);
        const categoryId = foundCategory ? String(foundCategory.id) : "";
        
        const typeStr = typeRaw?.trim().toLowerCase();
        const type =
          typeStr === "income" || typeStr === "수입" || typeStr === "0" 
            ? 0 
            : 1;

        // 고정 여부 매핑 (다양한 케이스 지원)
        const fixedStr = fixedRaw?.trim().toLowerCase();
        const isFixed = ["true", "1", "yes", "예", "y"].includes(fixedStr) ? 1 : 0;

        return {
          id: crypto.randomUUID(),
          date: date?.trim() || "",
          type: type,
          category_id: categoryId,
          is_fixed: isFixed,
          description: descRaw?.trim() || "",
          amount: amountRaw?.trim() || "",
          remarks: remarksRaw?.trim() || "",
        };
      });

      // 기존 데이터에 빈 행이 많으면 채워넣거나, 아니면 추가
      setData((prev) => {
        // 내용이 있는 행만 남기고 그 뒤에 추가
        const existingFilled = prev.filter(
          (r) =>
            r.date || r.description || r.amount || r.category_id || r.remarks
        );
        return [...existingFilled, ...newRows];
      });

      toast.success(`${newRows.length}개의 내역을 불러왔습니다.`);
    } catch (err) {
      console.error(err);
      toast.error("파일을 불러오는 데 실패했습니다.");
    }
  };

  const columns = useMemo<ColumnDef<QuickEntryTransactionRow>[]>(
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
        cell: (ctx) => {
          const tableMeta = ctx.table.options.meta as any;
          return (
            <DateCell
              {...ctx}
              colIdx={1}
              onPaste={handlePaste}
              error={tableMeta.errors?.[`${ctx.row.index}-date`]}
            />
          );
        },
      },
      {
        accessorKey: "category_id",
        header: "항목",
        size: 160,
        cell: (i) => (
          <CategoryCell
            {...i}
            colIdx={2}
            onPaste={handlePaste}
            error={rowErrors[i.row.original.id]?.category_id}
          />
        ),
      },
      {
        accessorKey: "is_fixed",
        header: "고정",
        size: 50,
        cell: (ctx) => (
          <FixedCheckboxCell {...ctx} colIdx={3} onPaste={handlePaste} />
        ),
      },
      {
        accessorKey: "description",
        header: "상세 내역",
        size: 180,
        cell: (i) => (
          <InputCell
            {...i}
            colIdx={4}
            error={rowErrors[i.row.original.id]?.description}
            onPaste={handlePaste}
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "금액",
        size: 100,
        meta: { type: "number" },
        cell: (i) => (
          <AmountCell
            {...i}
            colIdx={5}
            error={rowErrors[i.row.original.id]?.amount}
            onPaste={handlePaste}
          />
        ),
      },
      {
        accessorKey: "remarks",
        header: "메모",
        size: 150,
        cell: (i) => (
          <InputCell
            {...i}
            colIdx={6}
            error={rowErrors[i.row.original.id]?.remarks}
            onPaste={handlePaste}
          />
        ),
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
            className="h-8 w-8 text-slate-400 hover:text-red-500 flex items-center justify-center"
          >
            <Minus size={14} />
          </Button>
        ),
      },
    ],
    [updateData, data.length, rowErrors],
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
      dragRange,
      confirmUpdate,
    },
  });

  return (
    <div className="p-6 bg-slate-50 h-full">
      <div className="max-w-[1250px] mx-auto space-y-4">
        <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h2 className="font-bold">빠른 입력</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-white border-none"
              onClick={handleDownloadTemplate}
            >
              <Download size={16} className="mr-2" />
              템플릿 다운로드
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-white border-none"
              onClick={handleCsvUpload}
            >
              <Upload size={16} className="mr-2" />
              CSV 업로드
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveAll}
            >
              <Save size={16} className="mr-2" />
              저장
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm border-collapse table-fixed select-none">
            <thead className="bg-slate-50 border-b">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 border-r border-slate-200 text-slate-500 font-bold text-sm uppercase text-left"
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
                  {row.getVisibleCells().map((cell, idx) => {
                    const colIdx = idx;

                    const isSelectedByDrag =
                      dragRange &&
                      dragRange.colIdx === colIdx &&
                      row.index >= Math.min(dragRange.start, dragRange.end) &&
                      row.index <= Math.max(dragRange.start, dragRange.end);
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "p-0 border-r border-slate-100 relative h-10 transitio-colors",
                          isSelectedByDrag && "bg-blue-100/40",
                          activeCell?.rowIndex === row.index &&
                                activeCell?.colIdx === idx &&
                                "bg-white z-20 outline-2 outline-blue-500 outline-offset-[-1px]",
                        )}
                        onClick={() =>
                          setActiveCell({ rowIndex: row.index, colIdx: idx })
                        }
                      >
                        {React.createElement(
                          cell.column.columnDef.cell as any,
                          cell.getContext(),
                        )}
                        {isSelectedByDrag && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              setData((p) => [...p, createEmptyRow()]);
              setTimeout(
                () => setActiveCell({ rowIndex: data.length, colIdx: 1 }),
                50,
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

export default QuickEntry;
