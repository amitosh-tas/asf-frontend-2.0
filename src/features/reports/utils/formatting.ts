export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ISO 4217 minor-unit exponents that differ from 2 (JPY has none, KWD has three, ...)
const EXPONENTS: Record<string, number> = {
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0, PYG: 0, RWF: 0, UGX: 0,
  VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0, BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
};

export const currencyExponent = (currency: string) => EXPONENTS[currency?.toUpperCase?.() ?? ""] ?? 2;

/** API money values are strings in minor units of `currency`. */
export function formatMinorUnits(value: string | number | null | undefined, currency: string) {
  if (value === null || value === undefined || value === "") return "—";
  const exp = currencyExponent(currency);
  const major = Number(value) / 10 ** exp;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: exp,
      maximumFractionDigits: exp,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(exp)}`;
  }
}

/** Compact money for tight spaces ("₹1.2L", "$3.4K"). */
export function formatMinorCompact(value: string | number | null | undefined, currency: string) {
  if (value === null || value === undefined || value === "") return "—";
  const major = Number(value) / 10 ** currencyExponent(currency);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(major);
  } catch {
    return `${currency} ${major.toFixed(0)}`;
  }
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatMajorUnits(value: string, currency: string) {
  return formatCurrency(Number(value), currency);
}

export function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(date);
}
