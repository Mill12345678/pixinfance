import 'server-only';

import { google } from 'googleapis';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type DriveUploadResult = {
  fileId: string;
  webViewLink: string;
  name: string;
};

function loadCredentials(): Record<string, string> {
  if (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) as Record<string, string>;
  }

  const filePath = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE;
  if (!filePath) {
    throw new Error(
      'Google Drive not configured. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE or GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON in .env.local.'
    );
  }

  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), 'google-credentials.json');
  return JSON.parse(readFileSync(resolved, 'utf8')) as Record<string, string>;
}

function getDriveClient() {
  const credentials = loadCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file to the configured Drive folder ("Finance_Invoices").
 * Runs on the server only; the service account must have Editor access
 * to the folder (see Google_Cloud_Service_Account_Guide.md).
 */
export async function uploadToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<DriveUploadResult> {
  const targetFolder = folderId ?? process.env.GOOGLE_DRIVE_INVOICE_FOLDER_ID;
  if (!targetFolder) {
    throw new Error('Missing GOOGLE_DRIVE_INVOICE_FOLDER_ID in .env.local');
  }

  const drive = getDriveClient();
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;

  const res = await drive.files.create({
    requestBody: {
      name: storedName,
      parents: [targetFolder],
    },
    media: {
      mimeType,
      body: buffer,
    },
    fields: 'id,name,webViewLink',
  });

  return {
    fileId: res.data.id ?? '',
    webViewLink: res.data.webViewLink ?? '',
    name: res.data.name ?? storedName,
  };
}
