import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";

let db: Database | null = null;

export async function getDB() {
  if (!db) {
    // 앱 전용 데이터 폴더 경로를 가져옵니다 (~/.local/share/앱이름)
    const appDataDirPath = await appDataDir();
    const dbPath = await join(appDataDirPath, "finkro.db");

    // 명확한 절대 경로로 로드
    db = await Database.load(`sqlite:${dbPath}`);
  }
  return db;
}
