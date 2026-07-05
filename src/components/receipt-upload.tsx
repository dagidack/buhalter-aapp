"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DashboardCopy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type UploadResponse = {
  id: string;
  name: string;
  webViewLink: string | null;
  webContentLink: string | null;
  url: string | null;
};

type ReceiptUploadProps = {
  onUploaded?: (result: UploadResponse) => void;
  copy: DashboardCopy;
};

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

export function ReceiptUpload({ onUploaded, copy }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as UploadResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? copy.uploadError);
        }

        onUploaded?.(payload);
        toast.success(copy.uploadSuccess, {
          description: payload.name,
          action: payload.url
            ? {
                label: copy.uploadOpen,
                onClick: () => window.open(payload.url!, "_blank", "noopener"),
              }
            : undefined,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : copy.uploadError;
        toast.error(copy.uploadError, { description: message });
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [copy, onUploaded]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) {
        void uploadFile(file);
      }
    },
    [uploadFile]
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-neutral-900">{copy.uploadTitle}</h2>

      <div
        role="button"
        tabIndex={0}
        aria-label={copy.uploadDrop}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center transition",
          isDragging && "border-neutral-900 bg-neutral-50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-neutral-600" />
            <p className="text-sm text-neutral-600">{copy.uploadInProgress}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-800">{copy.uploadDrop}</p>
            <p className="mt-1 text-xs text-neutral-500">{copy.uploadHint}</p>
          </>
        )}
      </div>
    </section>
  );
}
