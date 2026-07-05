// VERSION 1.4: Dashboard with search and sort functionality
"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import { DEFAULT_LANGUAGE, getDashboardCopy, LANGUAGES, type Language } from "@/lib/i18n";
import { triggerAutomaticBackup } from "@/lib/backup";
import { type Transaction, type TransactionType } from "@/lib/mock-data";
import { formatDate, formatEur } from "@/lib/utils";

// VERSION: Update last digit only on each change (1.2, 1.3, etc.)
// MAJOR.MINOR format where MAJOR = global code version, MINOR = update counter
const APP_VERSION = "1.5";

// Auto-backup transactions to downloadable JSON file
const createBackupFile = async (transactions: Transaction[]) => {
  if (typeof window === "undefined") return;

  const backup = {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    transactionCount: transactions.length,
    transactions,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rm-finance-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};


type PeriodPreset = "all" | "day" | "week" | "month" | "quarter" | "year" | "custom";

type TransactionFormState = {
  date: string;
  amount: string;
  name: string;
  businessId: string;
  service: string;
  type: TransactionType;
  attachmentFile: File | null;
};

const createInitialFormState = (): TransactionFormState => ({
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  name: "",
  businessId: "",
  service: "",
  type: "expense",
  attachmentFile: null,
});

const getStorageKey = () => "rm-finance-transactions";

const normalizeTransaction = (transaction: Transaction): Transaction => ({
  ...transaction,
  type: transaction.type ?? "expense",
  service: transaction.service ?? "",
});

const writeTransactions = (transactions: Transaction[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(), JSON.stringify(transactions));
};

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getDateRange = (preset: PeriodPreset, customStart: string, customEnd: string) => {
  const today = new Date();
  const end = customEnd ? new Date(customEnd) : today;
  let start: Date;

  switch (preset) {
    case "day":
      start = new Date(end);
      break;
    case "week":
      start = addDays(end, -6);
      break;
    case "month":
      start = addDays(end, -29);
      break;
    case "quarter":
      start = addDays(end, -89);
      break;
    case "year":
      start = addDays(end, -364);
      break;
    case "custom":
      start = customStart ? new Date(customStart) : addDays(end, -29);
      break;
    case "all":
    default:
      start = new Date(2000, 0, 1);
      break;
  }

  return { start, end };
};

export function Dashboard() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<TransactionFormState>(createInitialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodPreset>("month");
  const [customStart, setCustomStart] = useState(toDateInputValue(addDays(new Date(), -29)));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(new Date()));
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [hasLoadedTransactions, setHasLoadedTransactions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupTimeoutRef = useRef<number | null>(null);
  const lastBackupSignatureRef = useRef<string | null>(null);
  const copy = useMemo(() => getDashboardCopy(language), [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(getStorageKey());
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Transaction[];
        setTransactions(parsed.map(normalizeTransaction));
      } catch {
        setTransactions([]);
      }
    }
    setHasLoadedTransactions(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedTransactions || transactions.length === 0) return;

    const signature = JSON.stringify(transactions);
    if (lastBackupSignatureRef.current === signature) return;

    if (backupTimeoutRef.current) {
      window.clearTimeout(backupTimeoutRef.current);
    }

    backupTimeoutRef.current = window.setTimeout(() => {
      lastBackupSignatureRef.current = signature;

      void triggerAutomaticBackup(transactions, {
        onSuccess: () => {
          toast.success("Backup uploaded to Google Drive.");
        },
        onSkip: (reason) => {
          if (reason !== "cooldown") {
            console.warn("Backup skipped", reason);
          }
        },
      });
    }, 1500);

    return () => {
      if (backupTimeoutRef.current) {
        window.clearTimeout(backupTimeoutRef.current);
      }
    };
  }, [hasLoadedTransactions, transactions]);

  const locale = language === "fi" ? "fi-FI" : language === "en" ? "en-GB" : "ru-RU";

  const normalizedTransactions = useMemo(
    () => transactions.map(normalizeTransaction),
    [transactions]
  );

  const sortedTransactions = useMemo(
    () =>
      [...normalizedTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [normalizedTransactions]
  );

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    
    let results = sortedTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const isInDateRange = txDate >= start && txDate <= end;
      
      if (!isInDateRange) return false;
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        tx.merchant.toLowerCase().includes(query) ||
        tx.businessId.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      );
    });
    
    // Apply sort
    results.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return results;
  }, [customEnd, customStart, period, sortedTransactions, searchQuery, sortOrder]);

  const chartData = useMemo(() => {
    const totals = filteredTransactions.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.date] = (acc[tx.date] ?? 0) + tx.amount;
      return acc;
    }, {});

    return Object.entries(totals).map(([date, amount]) => ({
      fullDate: date,
      label: formatDate(date, locale),
      amount,
    }));
  }, [filteredTransactions, locale]);

  const incomeTotal = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : 0), 0),
    [filteredTransactions]
  );

  const expenseTotal = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (tx.type === "expense" ? tx.amount : 0), 0),
    [filteredTransactions]
  );

  const totalSpend = useMemo(
    () => incomeTotal - expenseTotal,
    [incomeTotal, expenseTotal]
  );

  const selectedDay = chartData[chartData.length - 1]?.fullDate ?? "";

  const dayTransactions = useMemo(
    () => filteredTransactions.filter((tx) => tx.date === selectedDay),
    [filteredTransactions, selectedDay]
  );

  const dayTotal = useMemo(
    () => dayTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [dayTransactions]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setForm((current) => ({ ...current, attachmentFile: file ?? null }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(createInitialFormState());
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!form.name.trim() || !form.amount || !form.businessId.trim()) return;

      setIsUploading(true);
      let driveFileId: string | undefined;
      let driveFileLink: string | undefined;
      let driveFileName: string | undefined;

      if (form.attachmentFile) {
        try {
          const formData = new FormData();
          formData.append("file", form.attachmentFile);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as {
            id?: string;
            url?: string;
            name?: string;
            error?: string;
          };

          if (!response.ok) {
            throw new Error(payload.error ?? copy.uploadError);
          }

          driveFileId = payload.id;
          driveFileLink = payload.url;
          driveFileName = payload.name;

          toast.success(copy.uploadSuccess, {
            description: driveFileName ?? form.attachmentFile.name,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : copy.uploadError;
          toast.error(copy.uploadError, { description: message });
          setIsUploading(false);
          return;
        }
      }

      const nextEntry: Transaction = {
        id: editingId ?? crypto.randomUUID(),
        date: form.date,
        merchant: form.name.trim(),
        amount: Number(form.amount),
        businessId: form.businessId.trim(),
        type: form.type,
        service: form.service.trim(),
        driveFileId,
        driveFileLink,
        driveFileName,
        locked: false,
      };

      const nextTransactions = editingId
        ? transactions.map((tx) =>
            tx.id === editingId ? { ...nextEntry, locked: tx.locked } : tx
          )
        : [nextEntry, ...transactions];

      setTransactions(nextTransactions);
      writeTransactions(nextTransactions);
      resetForm();
      setIsUploading(false);
    },
    [
      editingId,
      form.amount,
      form.attachmentFile,
      form.businessId,
      form.date,
      form.name,
      form.service,
      form.type,
      resetForm,
      transactions,
      copy.uploadSuccess,
      copy.uploadError,
    ]
  );

  const startEditing = useCallback((entry: Transaction) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      amount: String(entry.amount),
      name: entry.merchant,
      businessId: entry.businessId,
      service: entry.service ?? "",
      type: entry.type ?? "expense",
      attachmentFile: null,
    });
  }, []);

  const deleteEntry = useCallback(
    (id: string) => {
      const nextTransactions = transactions.filter((tx) => tx.id !== id);
      setTransactions(nextTransactions);
      writeTransactions(nextTransactions);
      if (editingId === id) resetForm();
    },
    [editingId, resetForm, transactions]
  );

  const toggleLock = useCallback(
    (id: string) => {
      const nextTransactions = transactions.map((tx) =>
        tx.id === id ? { ...tx, locked: !tx.locked } : tx
      );
      setTransactions(nextTransactions);
      writeTransactions(nextTransactions);
    },
    [transactions]
  );

  const downloadStatement = useCallback(() => {
    const doc = new jsPDF();
    const docLocale = language === "fi" ? "fi-FI" : "en-GB";
    const { start, end } = getDateRange(period, customStart, customEnd);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(copy.statementTitle, 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${copy.statementGenerated}: ${new Intl.DateTimeFormat(docLocale, { dateStyle: "medium" }).format(new Date())}`, 14, 28);
    doc.text(`${copy.fromLabel}: ${formatDate(toDateInputValue(start), docLocale)} ${copy.toLabel}: ${formatDate(toDateInputValue(end), docLocale)}`, 14, 36);

    if (filteredTransactions.length === 0) {
      doc.text(copy.statementNoData, 14, 44);
      doc.save("rm-finance-statement.pdf");
      return;
    }

    autoTable(doc, {
      head: [[copy.statementDateLabel, copy.statementMerchantLabel, copy.serviceLabel, copy.typeLabel, copy.statementAmountLabel]],
      body: filteredTransactions.map((tx) => [
        formatDate(tx.date, docLocale),
        tx.merchant,
        tx.service || "—",
        tx.type === "income" ? copy.typeIncome : copy.typeExpense,
        formatEur(tx.amount, docLocale),
      ]),
      startY: 44,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const autoTableState = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable;
    const summaryY = autoTableState?.finalY ? autoTableState.finalY + 8 : 60;
    doc.setFont("helvetica", "bold");
    doc.text(`${copy.summaryIncomeLabel}: ${formatEur(incomeTotal, docLocale)}`, 14, summaryY);
    doc.text(`${copy.summaryExpenseLabel}: ${formatEur(expenseTotal, docLocale)}`, 80, summaryY);
    doc.text(`${copy.summaryTotalLabel}: ${formatEur(totalSpend, docLocale)}`, 146, summaryY);

    doc.save(`rm-finance-statement-${language}.pdf`);
  }, [copy, customEnd, customStart, expenseTotal, filteredTransactions, incomeTotal, language, period, totalSpend]);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-lg font-semibold flex items-center gap-2">
              {copy.appName}
              <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                v{APP_VERSION}
              </span>
            </p>
            <p className="text-sm text-neutral-500">{copy.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-600">{copy.languageLabel}</span>
            <div className="flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    language === item.value
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-white"
                  }`}
                  onClick={() => setLanguage(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {copy.formTitle}
              </p>
              <h2 className="text-lg font-semibold">{copy.formTitle}</h2>
              <p className="text-sm text-neutral-500">{copy.formSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => createBackupFile(transactions)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Export Backup
            </button>
          </div>

          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-neutral-700">
              <span className="mb-1 block">{copy.dateLabel}</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              <span className="mb-1 block">{copy.amountLabel}</span>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                placeholder="0.00"
                required
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              <span className="mb-1 block">{copy.nameLabel}</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                placeholder="Invoice / client"
                required
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              <span className="mb-1 block">{copy.businessIdLabel}</span>
              <input
                type="text"
                value={form.businessId}
                onChange={(event) => setForm((current) => ({ ...current, businessId: event.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                placeholder="YOUTUNUS-001"
                required
              />
            </label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              <span className="mb-1 block">{copy.serviceLabel}</span>
              <input
                type="text"
                value={form.service}
                onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                placeholder={copy.servicePlaceholder}
              />
            </label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              <span className="mb-1 block">{copy.typeLabel}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, type: "income" }))}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${form.type === "income" ? "bg-emerald-600 text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                >
                  {copy.typeIncome}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, type: "expense" }))}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${form.type === "expense" ? "bg-rose-600 text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                >
                  {copy.typeExpense}
                </button>
              </div>
            </label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              <span className="mb-1 block">{copy.attachmentLabel}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-xs text-neutral-500">{copy.attachmentHint}</p>
              {form.attachmentFile ? (
                <p className="mt-2 text-sm text-neutral-600">{form.attachmentFile.name}</p>
              ) : null}
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {copy.saveButton}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  {copy.cancelButton}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {copy.overviewTitle}
              </p>
              <h2 className="text-lg font-semibold">{copy.chartTitle}</h2>
              <p className="text-sm text-neutral-500">{copy.chartDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm text-neutral-600">
                <span className="mr-2">{copy.periodLabel}</span>
                <select value={period} onChange={(event) => setPeriod(event.target.value as PeriodPreset)} className="rounded-full border border-neutral-200 bg-white px-3 py-2">
                  <option value="all">{copy.periodAll}</option>
                  <option value="day">{copy.periodDay}</option>
                  <option value="week">{copy.periodWeek}</option>
                  <option value="month">{copy.periodMonth}</option>
                  <option value="quarter">{copy.periodQuarter}</option>
                  <option value="year">{copy.periodYear}</option>
                  <option value="custom">{copy.periodCustom}</option>
                </select>
              </label>
              {period === "custom" ? (
                <>
                  <label className="text-sm text-neutral-600">
                    <span className="mr-2">{copy.fromLabel}</span>
                    <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-full border border-neutral-200 bg-white px-3 py-2" />
                  </label>
                  <label className="text-sm text-neutral-600">
                    <span className="mr-2">{copy.toLabel}</span>
                    <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-full border border-neutral-200 bg-white px-3 py-2" />
                  </label>
                </>
              ) : null}
              <button type="button" onClick={downloadStatement} className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
                {copy.downloadPdf}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-neutral-50 p-3">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#4338ca" fill="#818cf8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{copy.dayChartTitle}</h3>
                  <p className="text-sm text-neutral-500">{copy.selectedDayLabel}</p>
                </div>
              </div>

              {dayTransactions.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayTransactions.map((tx) => ({ merchant: tx.merchant, amount: tx.amount }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="merchant" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-neutral-500">{copy.noTransactions}</p>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 p-4">
              <h3 className="font-semibold">{copy.daySummaryTitle}</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-sm text-neutral-500">{copy.summaryTotalLabel}</p>
                  <p className="text-xl font-semibold">{formatEur(totalSpend, locale)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-sm text-emerald-700">{copy.summaryIncomeLabel}</p>
                  <p className="text-xl font-semibold text-emerald-700">{formatEur(incomeTotal, locale)}</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <p className="text-sm text-rose-700">{copy.summaryExpenseLabel}</p>
                  <p className="text-xl font-semibold text-rose-700">{formatEur(expenseTotal, locale)}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-sm text-neutral-500">{copy.selectedDayLabel}</p>
                  <p className="mt-2 text-xl font-semibold">{formatEur(dayTotal, locale)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium">{copy.transactionsTitle}</h2>
            <p className="text-sm text-neutral-500">{filteredTransactions.length} {copy.transactionsTitle.toLowerCase()}</p>
          </div>

          <div className="border-b border-neutral-200 px-4 py-3 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-48 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="newest">{copy.sortNewest}</option>
              <option value="oldest">{copy.sortOldest}</option>
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">{copy.noTransactions}</p>
          ) : (
            <div className="grid gap-3 p-4">
              {filteredTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  locale={locale}
                  copy={copy}
                  onEdit={startEditing}
                  onDelete={deleteEntry}
                  onToggleLock={toggleLock}
                  onOpenDetail={setSelectedTransaction}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <TransactionDetailModal
        transaction={selectedTransaction}
        locale={locale}
        copy={copy}
        onClose={() => setSelectedTransaction(null)}
        onEdit={startEditing}
        onDelete={deleteEntry}
        isLocked={selectedTransaction?.locked}
      />
    </div>
  );
}
