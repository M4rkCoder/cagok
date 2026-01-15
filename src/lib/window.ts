import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

export const setWindowSize = async (w: number, h: number) => {
  const window = getCurrentWindow();
  await window.setSize(new LogicalSize(w, h));
  await window.center();
};

export const enableResize = async () => {
  const window = getCurrentWindow();
  await window.setResizable(true);
};

export const windowShow = async () => {
  const window = getCurrentWindow();
  await window.show(); // 👈 꼭 await 필요
};

export const setMinSize = async (width: number, height: number) => {
  const window = getCurrentWindow();
  await window.setMinSize(new LogicalSize(width, height)); // 👈 꼭 await 필요
};
