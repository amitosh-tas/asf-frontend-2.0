import type { SelectHTMLAttributes } from "react";
import { useAttributionModels } from "../hooks/useAttributionModels";

interface AttributionModelSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  includeDefaultOption?: boolean;
}

export default function AttributionModelSelect({
  includeDefaultOption = false,
  children,
  ...props
}: AttributionModelSelectProps) {
  const { defaultModel, options } = useAttributionModels();

  return (
    <select {...props}>
      {includeDefaultOption && !defaultModel && <option value="">Company default</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
}
