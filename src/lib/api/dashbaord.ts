import { invoke } from "@tauri-apps/api/core";
import { ComparisonMetric, ComparisonType } from "@/types";

interface CompareParams {
  comparisonType: ComparisonType;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

export async function getPeriodComparison(
  params: CompareParams
): Promise<ComparisonMetric> {
  return invoke("compare_dashboard", {
    comparisonType: params.comparisonType,
    currentStart: params.currentStart,
    currentEnd: params.currentEnd,
    previousStart: params.previousStart,
    previousEnd: params.previousEnd,
  });
}
