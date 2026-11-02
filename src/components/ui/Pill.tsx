import { revenueSourceColors } from "@/config/revenue";

interface IPill {
  name: string;
}

function getPlatformColors(name: string) {
  const knownColors = revenueSourceColors[name];
  return knownColors?.color ?? "var(--color-text-muted)";
}

function Pill({ name }: IPill) {
  const color = getPlatformColors(name.trim().toLowerCase());

  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-muted px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-text"
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

export default Pill;
