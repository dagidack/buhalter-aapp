// VERSION 1.4: Transaction detail modal with backup functionality
"use client";

import { X, ExternalLink, Download } from "lucide-react";
import type { DashboardCopy } from "@/lib/i18n";
import type { Transaction } from "@/lib/mock-data";
import { formatDate, formatEur } from "@/lib/utils";

type TransactionDetailModalProps = {
  transaction: Transaction | null;
  locale: string;
  copy: DashboardCopy;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  isLocked?: boolean;
};

export function TransactionDetailModal({
  transaction,
  locale,
  copy,
  onClose,
  onEdit,
  onDelete,
  isLocked,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold">{copy.transactionCardTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-neutral-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">
                {copy.dateLabel}
              </p>
              <p className="text-lg font-semibold">
                {formatDate(transaction.date, locale)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">
                {copy.amountLabel}
              </p>
              <p className="text-lg font-semibold">
                {formatEur(transaction.amount, locale)}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">
                {copy.nameLabel}
              </p>
              <p className="text-lg font-semibold">{transaction.merchant}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">
                {copy.businessIdLabel}
              </p>
              <p className="font-mono text-sm bg-neutral-50 p-3 rounded-lg">
                {transaction.businessId}
              </p>
            </div>

            {transaction.driveFileName && (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">
                  {copy.attachmentLabel}
                </p>
                <p className="text-sm text-neutral-700 mb-2">{transaction.driveFileName}</p>
                {transaction.driveFileLink && (
                  <a
                    href={transaction.driveFileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition font-medium text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {copy.driveLink}
                  </a>
                )}
              </div>
            )}
          </div>

          {isLocked && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-700">{copy.lockedWarning}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-neutral-200 px-6 py-4">
          {!isLocked && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="rounded-lg bg-neutral-900 text-white px-4 py-2 font-medium hover:bg-neutral-800 transition"
            >
              {copy.editButton}
            </button>
          )}
          {!isLocked && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this transaction?")) {
                  onDelete(transaction.id);
                  onClose();
                }
              }}
              className="rounded-lg bg-red-50 text-red-600 px-4 py-2 font-medium hover:bg-red-100 transition"
            >
              {copy.deleteButton}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
