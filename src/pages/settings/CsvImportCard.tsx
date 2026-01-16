import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog"; // Tauri v2 기준
import { readTextFile } from "@tauri-apps/plugin-fs"; // 파일 읽기
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";
import Papa from "papaparse"; // CSV 파싱 라이브러리

interface TransactionRow {
  date: string;
  type: string;
  category: string;
  amount: number;
  is_fixed: boolean;
  description: string;
  remarks: string;
}

export function CsvImportCard() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  // CSV 파일 선택
  const selectCsvFile = async () => {
    const selected = await open({
      filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });

    if (typeof selected === "string") {
      setFilePath(selected);
      loadCsvPreview(selected);
    }
  };

  // CSV 읽고 preview 업데이트
  const loadCsvPreview = async (path: string) => {
    try {
      const text = await readTextFile(path);
      const result = Papa.parse<TransactionRow>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        console.error(result.errors);
        toast.error("CSV 파싱 오류가 발생했습니다.");
        return;
      }

      // 숫자/불리언 변환
      const rows = result.data.map((row) => ({
        ...row,
        amount: Number(row.amount),
        is_fixed: row.is_fixed === "true" || row.is_fixed === true,
      }));

      setPreviewRows(rows);
    } catch (err) {
      console.error(err);
      toast.error("CSV 파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  // 실제 업로드
  const importCsv = async () => {
    if (!filePath) {
      toast.error("CSV 파일을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const insertedCount = await invoke("import_transactions_csv", {
        file_path: filePath,
      });

      toast.success(`거래 ${insertedCount}건을 가져왔습니다.`);
      setFilePath(null);
      setPreviewRows([]);
    } catch (e) {
      toast.error(`CSV 가져오기 실패: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 font-semibold">
        <FileText className="w-5 h-5" />
        CSV 가져오기
      </div>

      <div className="text-sm text-muted-foreground">
        CSV 파일을 선택하여 거래 내역을 추가할 수 있습니다.
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={selectCsvFile}
          className="justify-start"
        >
          <Upload className="w-4 h-4 mr-2" />
          CSV 파일 선택
        </Button>

        {filePath && (
          <div className="text-xs break-all text-muted-foreground">
            {filePath}
          </div>
        )}

        {/* CSV 미리보기 */}
        {previewRows.length > 0 && (
          <div className="overflow-auto max-h-64 border rounded p-2 mt-2 text-xs">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border px-2 py-1">날짜</th>
                  <th className="border px-2 py-1">타입</th>
                  <th className="border px-2 py-1">카테고리</th>
                  <th className="border px-2 py-1">금액</th>
                  <th className="border px-2 py-1">고정 여부</th>
                  <th className="border px-2 py-1">설명</th>
                  <th className="border px-2 py-1">비고</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{row.date}</td>
                    <td className="border px-2 py-1">{row.type}</td>
                    <td className="border px-2 py-1">{row.category}</td>
                    <td className="border px-2 py-1">{row.amount}</td>
                    <td className="border px-2 py-1">
                      {row.is_fixed ? "예" : "아니오"}
                    </td>
                    <td className="border px-2 py-1">{row.description}</td>
                    <td className="border px-2 py-1">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button onClick={importCsv} disabled={!filePath || loading}>
        {loading ? "가져오는 중..." : "가져오기"}
      </Button>
    </Card>
  );
}
