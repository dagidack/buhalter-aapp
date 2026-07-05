import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createBackupPayload } from "@/lib/backup";
import { uploadTextFileToDrive } from "@/lib/google-drive";
import type { Transaction } from "@/lib/mock-data";

export const runtime = "nodejs";

async function fetchTransactionsFromSupabase(): Promise<Transaction[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await client.from("transactions").select("*").order("date", { ascending: true });

  if (error) {
    console.warn("Supabase fallback backup failed", error.message);
    return [];
  }

  return (data ?? []) as Transaction[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const transactions = Array.isArray(body?.transactions) ? (body.transactions as Transaction[]) : [];
    const resolvedTransactions = transactions.length > 0 ? transactions : await fetchTransactionsFromSupabase();
    const source = transactions.length > 0 ? "local" : resolvedTransactions.length > 0 ? "supabase" : "empty";
    const payload = createBackupPayload(resolvedTransactions, source);
    const serialized = JSON.stringify(payload, null, 2);
    const backupName = `backup_${new Date().toISOString().slice(0, 10)}.json`;

    const uploaded = await uploadTextFileToDrive({
      fileName: backupName,
      content: serialized,
      mimeType: "application/json",
    });

    return NextResponse.json({
      ok: true,
      uploadedFileName: backupName,
      fileId: uploaded.id,
      fileName: uploaded.name,
      fileUrl: uploaded.webViewLink ?? uploaded.webContentLink,
      source,
    });
  } catch (error) {
    console.error("Backup upload failed", error);

    const message = error instanceof Error ? error.message : "Backup failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
