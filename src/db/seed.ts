// src/db/seed.ts
import {
  resetAllDummyData,
  insertDummyCategories,
  insertDummyTransactions,
} from "./dummyData";

async function runSeed() {
  console.log("🚀 더미 데이터 생성 시작");

  await resetAllDummyData();
  await insertDummyCategories();

  // 월별 더미 데이터
  await insertDummyTransactions(100, 2025, 1);
  await insertDummyTransactions(120, 2025, 2);
  await insertDummyTransactions(80, 2025, 3);

  console.log("✅ 더미 데이터 생성 완료");
}

runSeed().catch(console.error);
