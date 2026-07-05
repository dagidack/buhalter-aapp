import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive, validateUploadFile } from "@/lib/google-drive";

export const runtime = "nodejs";

// VERSION 1.4: File upload API with transaction support
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Файл не найден в запросе." },
        { status: 400 }
      );
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFileToDrive(file, buffer);

    return NextResponse.json({
      id: uploaded.id,
      name: uploaded.name,
      webViewLink: uploaded.webViewLink,
      webContentLink: uploaded.webContentLink,
      url: uploaded.webViewLink ?? uploaded.webContentLink,
    });
  } catch (error) {
    console.error("Drive upload failed:", error);

    const message =
      error instanceof Error ? error.message : "Не удалось загрузить файл.";

    const status = message.includes("not configured") ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
