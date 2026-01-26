// src/db/seed.ts
import {
  resetAllDummyData,
  insertDummyCategories,
  insertDummyTransactions,
} from "./dummyData";

export default async function runSeed() {
  console.log("🚀 더미 데이터 생성 시작");

  await resetAllDummyData();
  await insertDummyCategories();

  // 월별 더미 데이터
  await insertDummyTransactions(100, 2026, 1);
  await insertDummyTransactions(120, 2026, 2);
  await insertDummyTransactions(80, 2026, 3);
  await insertDummyTransactions(90, 2026, 4);
  await insertDummyTransactions(110, 2026, 5);

  console.log("✅ 더미 데이터 생성 완료");
}
