import { useCallback, useEffect, useState } from "react";
import {
  generateKey,
  getCompanyKey,
  revokeCompanyKey,
  rotateCompanyKey,
  updateCompanyKey,
  type KeyCredentials,
} from "@/services/apiService";
import type { CompanyApiKey } from "../types/apiKey.types";
import toast from "react-hot-toast";

export function useCompanyApiKeys() {
  const [keys, setKeys] = useState<CompanyApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");

  const [selectedKey, setSelectedKey] =
    useState<CompanyApiKey | null>(null);

  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCompanyKey();
      const payload = response.data;

      const keysData = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : null;

      if (!keysData) {
        throw new Error("Unexpected API response format.");
      }

      setKeys(keysData as CompanyApiKey[]);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setError("Unable to load API keys. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const rotateKey = async () => {
    if (!selectedKey || rotating) return;

    setRotating(true);
    setError("");

    try {
      const response = await rotateCompanyKey(selectedKey.id);

      // Supports both { data: { key } } and { key }.
      const key: string | undefined =
        response.data?.data?.key ?? response.data?.key;

      if (!key) {
        throw new Error("The server did not return the new API key.");
      }

      setNewSecret(key);
      setSecretCopied(false);
      setCopyError("");
      setSelectedKey(null);

      await fetchKeys();
      toast.success("API key rotated successfully.");
    } catch (err) {
      console.error("Failed to rotate API key:", err);
      setError(
        "Unable to rotate the API key. Please try again."
      );
    } finally {
      setRotating(false);
    }
  };

  const createKey = async (credentials: KeyCredentials) => {
    if (creating) return false;

    setCreating(true);
    setCreateError("");

    try {
      const response = await generateKey(credentials);
      const key: string | undefined =
        response.data?.data?.key ?? response.data?.key;

      if (!key) {
        throw new Error("The server did not return the new API key.");
      }

      setNewSecret(key);
      setSecretCopied(false);
      setCopyError("");
      await fetchKeys();
      toast.success("API key generated successfully.");
      return true;
    } catch (err) {
      console.error("Failed to create API key:", err);
      setCreateError("Unable to create the API key. Please try again.");
      return false;
    } finally {
      setCreating(false);
    }
  };

  const updateKey = async (
    id: string,
    credentials: KeyCredentials,
  ) => {
    if (updating || rotating || revoking) return false;

    setUpdating(true);
    setError("");

    try {
      await updateCompanyKey(id, credentials);
      await fetchKeys();
      toast.success("API key updated successfully.");
      return true;
    } catch (err) {
      console.error("Failed to update API key:", err);
      setError("Unable to update the API key. Please try again.");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (revoking || rotating || updating) return false;

    setRevoking(true);
    setError("");

    try {
      await revokeCompanyKey(id);
      await fetchKeys();
      toast.success("API key revoked successfully.");
      return true;
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      setError("Unable to revoke the API key. Please try again.");
      return false;
    } finally {
      setRevoking(false);
    }
  };

  const copySecret = async () => {
    if (!newSecret) return;

    setCopyError("");

    try {
      await navigator.clipboard.writeText(newSecret);
      setSecretCopied(true);
      toast.success("API key copied to clipboard.");
    } catch (err) {
      console.error("Unable to copy API key:", err);
      setSecretCopied(false);
      setCopyError(
        "Clipboard access failed. Select and copy the key manually."
      );
    }
  };

  const closeSecretModal = () => {
    setNewSecret(null);
    setSecretCopied(false);
    setCopyError("");
  };

  return {
    keys,
    loading,
    rotating,
    creating,
    updating,
    revoking,
    error,
    createError,
    selectedKey,
    setSelectedKey,
    newSecret,
    secretCopied,
    copyError,
    fetchKeys,
    rotateKey,
    createKey,
    updateKey,
    revokeKey,
    copySecret,
    closeSecretModal,
  };
}