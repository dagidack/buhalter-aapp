import fs from "fs";
import path from "path";
import { google } from "googleapis";

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function resolveEnvPath(candidate: string): string {
  if (path.isAbsolute(candidate)) {
    return candidate;
  }

  const cwdPath = path.join(process.cwd(), candidate);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  const packagedProcess = process as NodeJS.Process & { resourcesPath?: string };
  const packagedPath = path.join(packagedProcess.resourcesPath ?? "", candidate);
  if (fs.existsSync(packagedPath)) {
    return packagedPath;
  }

  return cwdPath;
}

function getKeyFilePath(): string {
  const configuredKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim();
  if (configuredKey) {
    return resolveEnvPath(configuredKey);
  }

  const fallback = path.join(process.cwd(), "My Accounting App IAM.json");
  if (fs.existsSync(fallback)) {
    return fallback;
  }

  const packagedProcess = process as NodeJS.Process & { resourcesPath?: string };
  const packagedFallback = path.join(packagedProcess.resourcesPath ?? "", "secrets", "My Accounting App IAM.json");
  if (fs.existsSync(packagedFallback)) {
    return packagedFallback;
  }

  throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_FILE is not configured");
}

function getFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");
  }
  return folderId;
}

export function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: getKeyFilePath(),
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: "v3", auth });
}

export type DriveUploadResult = {
  id: string;
  name: string;
  webViewLink: string | null;
  webContentLink: string | null;
};

export async function uploadFileToDrive(file: File, buffer: Buffer): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const { Readable } = await import("stream");

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [getFolderId()],
    },
    media: {
      mimeType: file.type,
      body: Readable.from(buffer),
    },
    fields: "id, name, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  if (!response.data.id || !response.data.name) {
    throw new Error("Google Drive did not return file metadata");
  }

  return {
    id: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink ?? null,
    webContentLink: response.data.webContentLink ?? null,
  };
}

export async function uploadTextFileToDrive(options: {
  fileName: string;
  content: string;
  mimeType?: string;
  parentFolderId?: string;
}): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const { Readable } = await import("stream");
  const backupFolderId = await ensureFolderExists("RM_fin_backups", options.parentFolderId);
  const buffer = Buffer.from(options.content, "utf8");

  const response = await drive.files.create({
    requestBody: {
      name: options.fileName,
      parents: [backupFolderId],
    },
    media: {
      mimeType: options.mimeType ?? "application/json",
      body: Readable.from(buffer),
    },
    fields: "id, name, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  if (!response.data.id || !response.data.name) {
    throw new Error("Google Drive did not return file metadata");
  }

  return {
    id: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink ?? null,
    webContentLink: response.data.webContentLink ?? null,
  };
}

export async function ensureFolderExists(folderName: string, parentFolderId?: string): Promise<string> {
  const drive = getDriveClient();
  const targetParentId = parentFolderId ?? getFolderId();
  const escapedName = folderName.replace(/'/g, "\\'");
  const query = `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and '${targetParentId}' in parents and trashed=false`;

  const existing = await drive.files.list({
    q: query,
    fields: "files(id,name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 10,
  });

  const folder = existing.data.files?.[0];
  if (folder?.id) {
    return folder.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [targetParentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!created.data.id) {
    throw new Error("Google Drive did not return a folder id");
  }

  return created.data.id;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Допустимы только изображения (JPEG, PNG, WebP) и PDF.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Максимальный размер файла — 15 МБ.";
  }

  return null;
}
