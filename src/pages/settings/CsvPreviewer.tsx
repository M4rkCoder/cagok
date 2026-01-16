import React, { useState } from "react";
import Papa from "papaparse"; // CSV 파싱 라이브러리
import { invoke } from "@tauri-apps/api/core";

interface CsvRow {
  date: string;
  type: string;
  category: string;
  amount: string; // string으로 먼저 읽고, 서버에서 float 변환
  is_fixed: string; // "true" / "false"
  description: string;
  remarks?: string;
}

export const CsvPreviewer = () => {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data);
      },
      error: (err) => {
        alert("CSV parsing error: " + err.message);
      },
    });
  };

  const handleUpload = async () => {
    if (!rows.length) return;
    try {
      const filePath = ""; // 실제로 Tauri에서 파일 선택 후 path 가져오는 로직 필요
      const inserted = await invoke("import_transactions_csv", {
        file_path: filePath,
      });
      alert(`${inserted} transactions imported!`);
      setRows([]);
    } catch (err) {
      console.error(err);
      alert("Import failed");
    }
  };

  return (
    <div className="p-4">
      <input type="file" accept=".csv" onChange={handleFile} />
      {rows.length > 0 && (
        <>
          <h3 className="mt-4">Preview: {fileName}</h3>
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Fixed</th>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{row.date}</td>
                    <td className="border p-2">{row.type}</td>
                    <td className="border p-2">{row.category}</td>
                    <td className="border p-2">{row.amount}</td>
                    <td className="border p-2">{row.is_fixed}</td>
                    <td className="border p-2">{row.description}</td>
                    <td className="border p-2">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleUpload}
          >
            Upload
          </button>
        </>
      )}
    </div>
  );
};
