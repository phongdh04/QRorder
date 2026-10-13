import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ theo chuẩn VND: 120.000đ
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0đ";
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

/**
 * Tạo token ngẫu nhiên bảo mật độ dài >= 24 ký tự
 */
export function generateTableToken(prefix = "tbl"): string {
  const rand = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  return `${prefix}_${rand}`.substring(0, 32);
}
