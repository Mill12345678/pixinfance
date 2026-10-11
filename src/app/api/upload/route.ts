import { NextRequest } from 'next/server';
import { uploadToDrive } from '@/lib/google/drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Missing file' }, { status: 400 });
    }

    const fileBlob = file as File;
    if (!ALLOWED_MIME.includes(fileBlob.type)) {
      return Response.json({ error: `Unsupported file type: ${fileBlob.type}` }, { status: 415 });
    }
    if (fileBlob.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File exceeds 10MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const result = await uploadToDrive(buffer, fileBlob.name, fileBlob.type);

    return Response.json(result);
  } catch (error) {
    console.error('Upload failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
