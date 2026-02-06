import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCategoryColors = (categories: any[]) => {
  return categories.map((cat, index) => {
    const lightness = 30 + index * (55 / Math.max(categories.length - 1, 1));
    return {
      ...cat,
      color: `hsl(221, 83%, ${lightness}%)`,
    };
  });
};
