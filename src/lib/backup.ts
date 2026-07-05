import type { Transaction } from "@/lib/mock-data";

const APP_VERSION = "1.5";
const BACKUP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LAST_BACKUP_KEY = "rm-fin-last-backup-at";

export type BackupResponse = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  uploadedFileName?: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string | null;
  source?: string;
};

export type BackupOptions = {
  onSuccess?: (result: BackupResponse) => void;
  onSkip?: (reason: string) => void;
};

export function createBackupPayload(transactions: Transaction[], source: string = "local") {
  return {
    appName: "RM fin",
    appVersion: APP_VERSION,
    exportDate: new Date().toISOString(),
    source,
    transactionCount: transactions.length,
    transactions,
  };
}

export function shouldRunBackup(now = Date.now()): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const lastValue = window.localStorage.getItem(LAST_BACKUP_KEY);
  if (!lastValue) {
    return true;
  }

  const lastRun = Number(lastValue);
  return Number.isFinite(lastRun) && now - lastRun >= BACKUP_COOLDOWN_MS;
}

export function markBackupCompleted(now = Date.now()) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_BACKUP_KEY, now.toString());
  }
}

export async function triggerAutomaticBackup(
  transactions: Transaction[],
  options: BackupOptions = {}
): Promise<BackupResponse> {
  if (typeof window === "undefined") {
    return { ok: false, skipped: true, reason: "window-unavailable" };
  }

  if (!shouldRunBackup()) {
    options.onSkip?.("cooldown");
    return { ok: false, skipped: true, reason: "cooldown" };
  }

  const response = await fetch("/api/backup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactions }),
  });

  const result = (await response.json().catch(() => ({ ok: false }))) as BackupResponse;

  if (response.ok && result.ok) {
    markBackupCompleted();
    options.onSuccess?.(result);
    return result;
  }

  options.onSkip?.("request-failed");
  return result;
}
