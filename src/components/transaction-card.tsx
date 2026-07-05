// VERSION 1.4: Transaction card component with clickable detail view
"use client";

import { Lock, LockOpen, ExternalLink, Trash2 } from "lucide-react";
import type { DashboardCopy } from "@/lib/i18n";
import type { Transaction } from "@/lib/mock-data";
import { formatDate, formatEur } from "@/lib/utils";

type TransactionCardProps = {
  transaction: Transaction;
  locale: string;
  copy: DashboardCopy;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  onOpenDetail: (tx: Transaction) => void;
};

export function TransactionCard({
  transaction,
  locale,
  copy,
  onEdit,
  onDelete,
  onToggleLock,
  onOpenDetail,
}: TransactionCardProps) {
  const isLocked = transaction.locked ?? false;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-md transition cursor-pointer"
      onClick={() => onOpenDetail(transaction)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {transaction.merchant}
          </h3>
          <p className="text-sm text-neutral-500">
            {formatDate(transaction.date, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-neutral-900">
            {formatEur(transaction.amount, locale)}
          </p>
          <button
            type="button"
            onClick={(e) => {
              handleButtonClick(e);
              onToggleLock(transaction.id);
            }}
            title={isLocked ? copy.unlockButton : copy.lockButton}
            className={`mt-1 p-1 rounded transition ${
              isLocked
                ? "text-red-600 hover:bg-red-50"
                : "text-neutral-400 hover:bg-neutral-100"
            }`}
          >
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-3 pb-3 border-b border-neutral-100">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase">
            {copy.businessIdLabel}
          </p>
          <p className="text-sm text-neutral-700">{transaction.businessId}</p>
        </div>
        {transaction.driveFileName && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase">
              {copy.attachmentLabel}
            </p>
            <p className="text-sm text-neutral-700">{transaction.driveFileName}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {transaction.driveFileLink && (
          <a
            href={transaction.driveFileLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleButtonClick}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
          >
            <ExternalLink className="h-4 w-4" />
            {copy.driveLink}
          </a>
        )}
        {!isLocked && (
          <>
            <button
              type="button"
              onClick={(e) => {
                handleButtonClick(e);
                onEdit(transaction);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition"
            >
              {copy.editButton}
            </button>
            <button
              type="button"
              onClick={(e) => {
                handleButtonClick(e);
                onDelete(transaction.id);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
              {copy.deleteButton}
            </button>
          </>
        )}
        {isLocked && (
          <span className="text-xs text-red-600 italic">{copy.lockedWarning}</span>
        )}
      </div>
    </div>
  );
}

