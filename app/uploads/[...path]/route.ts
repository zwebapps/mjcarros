import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import {
  getUploadMimeType,
  resolveUploadFilePath,
} from '@/lib/public-uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve files from `public/uploads/` at `/uploads/...`.
 * Ensures uploads work in Docker even when static `public/` serving misses runtime files.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = resolveUploadFilePath(params.path ?? []);
  if (!filePath) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': getUploadMimeType(filePath),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }
    console.error('[UPLOADS_SERVE]', filePath, err);
    return new NextResponse('Error loading file', { status: 500 });
  }
}
