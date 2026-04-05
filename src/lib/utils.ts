// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = "fr-ML"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "XOF"): string {
  return new Intl.NumberFormat("fr-ML", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function calculateSeniority(startDate: string): string {
  const start = new Date(startDate);
  const today = new Date();
  const years = today.getFullYear() - start.getFullYear();
  const months = today.getMonth() - start.getMonth();
  if (years === 0) return `${months} mois`;
  if (months < 0) return `${years - 1} an(s)`;
  return `${years} an(s) ${months > 0 ? `${months} mois` : ""}`;
}

export function isContractExpiringSoon(endDate: string | null, daysThreshold = 30): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const diff = end.getTime() - Date.now();
  return diff > 0 && diff < daysThreshold * 24 * 60 * 60 * 1000;
}
