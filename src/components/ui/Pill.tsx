import { revenueSourceColors } from "@/config/revenue";

interface IPill {
  name: string;
}

function getPlatformColors(name: string) {
  const knownColors = revenueSourceColors[name];
  if (knownColors) {
    return {
      backgroundColor: knownColors.backgroundColor,
      textColor: knownColors.textColor,
      dotColor: knownColors.color,
    };
  }

  return {
    backgroundColor: "#F3F3F3",
    textColor: "#404040",
    dotColor: "#737373",
  };
}

function Pill({ name }: IPill) {
  const colors = getPlatformColors(name.trim().toLowerCase());

  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: colors.backgroundColor,
        color: colors.textColor,
      }}
    >
      {/* <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: colors.dotColor }}
      /> */}
      {name}
    </span>
  );
}

export default Pill;