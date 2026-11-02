import { useAppSelector } from "@/app/hooks";
import { getAttributionModelOptions } from "@/services/insights";

export function useAttributionModels() {
  const availableModels = useAppSelector((state) => state.auth.user?.workspace?.availableModels ?? []);
  const defaultModel = useAppSelector((state) => state.auth.user?.workspace?.defaultModel);

  return {
    availableModels,
    defaultModel,
    options: getAttributionModelOptions(availableModels),
  };
}
