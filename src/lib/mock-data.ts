// VERSION CONTROL: Increment only the last digit (patch version) with each update.
// Format: MAJOR.MINOR where MAJOR represents global code version,
// MINOR (patch) is incremented on each change. Start: 1.1
export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  businessId: string;
  type: TransactionType;
  service: string;
  locked?: boolean;
  category?: string;
  driveFileId?: string;
  driveFileLink?: string;
  driveFileName?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
};

export const TRANSACTIONS: Transaction[] = [];
