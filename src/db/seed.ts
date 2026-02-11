// src/db/seed.ts
import {
  resetAllDummyData,
  insertDummyCategories,
  insertDummyTransactions,
} from "./dummyData";

export default async function runSeed() {
  console.log("🚀 동적 더미 데이터 생성 시작");

  await resetAllDummyData();
  await insertDummyCategories();

  // 현재 날짜 기준
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth()는 0부터 시작

  // 이번 달 포함 과거 15개월 전부터 생성 (총 16개월)
  for (let i = 15; i >= 0; i--) {
    // 현재 날짜에서 i개월을 뺀 날짜 계산
    const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    // 한 달에 생성할 데이터 양을 랜덤하게 설정 (예: 80개 ~ 130개)
    const randomCount = Math.floor(Math.random() * (130 - 80 + 1)) + 80;

    console.log(
      `📅 ${targetYear}년 ${targetMonth}월 데이터 ${randomCount}건 생성 중...`
    );
    await insertDummyTransactions(randomCount, targetYear, targetMonth);
  }

  console.log("✅ 더미 데이터 생성 완료");
}
