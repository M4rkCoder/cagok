import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDB() {
  if (!db) {
    db = await Database.load("sqlite:finkro.db");
  }
  return db;
}
