export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMinorUnits(value: string, currency: string) {
  return formatCurrency(Number(value) / 100, currency);
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
