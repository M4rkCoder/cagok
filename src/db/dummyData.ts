// src/db/dummyData.ts
import { getDB } from "./database";

/* =========================
   유틸 함수
========================= */

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(year = 2025, month = 1) {
  const day = randomInt(1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

/* =========================
   카테고리 더미 정의
========================= */

const categorySeed = [
  // Income
  { name: "월급", icon: "💼", type: 0 },
  { name: "부수입", icon: "💰", type: 0 },
  { name: "용돈", icon: "🎁", type: 0 },

  // Expense
  { name: "식비", icon: "🍔", type: 1 },
  { name: "교통비", icon: "🚇", type: 1 },
  { name: "카페", icon: "☕", type: 1 },
  { name: "쇼핑", icon: "🛍️", type: 1 },
  { name: "고정비", icon: "🏠", type: 1 },
];

/* =========================
   카테고리 더미 생성
========================= */

export async function insertDummyCategories() {
  const db = await getDB();

  await db.execute("BEGIN TRANSACTION");

  try {
    for (const category of categorySeed) {
      await db.execute(
        `
        INSERT OR IGNORE INTO categories (name, icon, type)
        VALUES (?, ?, ?)
        `,
        [category.name, category.icon, category.type]
      );
    }

    await db.execute("COMMIT");
    console.log("✅ 카테고리 더미 데이터 생성 완료");
  } catch (error) {
    await db.execute("ROLLBACK");
    console.error("❌ 카테고리 더미 생성 실패", error);
  }
}

/* =========================
   카테고리 ID 조회
========================= */

async function getCategoryIds(type: 0 | 1): Promise<number[]> {
  const db = await getDB();

  const result = await db.select<{ id: number }[]>(
    "SELECT id FROM categories WHERE type = ?",
    [type]
  );

  return result.map((row) => row.id);
}

/* =========================
   트랜잭션 더미 생성
========================= */

export async function insertDummyTransactions(
  count = 100,
  year = 2025,
  month = 1
) {
  const db = await getDB();

  const incomeCategoryIds = await getCategoryIds(0);
  const expenseCategoryIds = await getCategoryIds(1);

  if (!incomeCategoryIds.length || !expenseCategoryIds.length) {
    throw new Error("카테고리가 없습니다. 먼저 카테고리를 생성하세요.");
  }

  await db.execute("BEGIN TRANSACTION");

  try {
    for (let i = 0; i < count; i++) {
      const isIncome = Math.random() < 0.2;
      const type = isIncome ? 0 : 1;

      const categoryId = isIncome
        ? incomeCategoryIds[randomInt(0, incomeCategoryIds.length - 1)]
        : expenseCategoryIds[randomInt(0, expenseCategoryIds.length - 1)];

      const amount = isIncome
        ? randomInt(200000, 500000)
        : randomInt(3000, 100000);

      const isFixed = !isIncome && Math.random() < 0.3 ? 1 : 0;

      await db.execute(
        `
        INSERT INTO transactions
        (description, amount, date, type, is_fixed, category_id)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          isIncome ? "더미 수입" : "더미 지출",
          amount,
          randomDate(year, month),
          type,
          isFixed,
          categoryId,
        ]
      );
    }

    await db.execute("COMMIT");
    console.log(`✅ 트랜잭션 더미 ${count}개 생성 완료`);
  } catch (error) {
    await db.execute("ROLLBACK");
    console.error("❌ 트랜잭션 더미 생성 실패", error);
  }
}

/* =========================
   전체 초기화
========================= */

export async function resetAllDummyData() {
  const db = await getDB();

  await db.execute(`
    DELETE FROM transactions;
    DELETE FROM categories;

    DELETE FROM sqlite_sequence WHERE name='transactions';
    DELETE FROM sqlite_sequence WHERE name='categories';
  `);

  console.log("🧹 카테고리 + 트랜잭션 전체 초기화 완료");
}
