import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    // Allowlist upload destinations under `public/uploads/`.
    // We keep accepting `products` for backward compatibility but normalize it to `product`.
    const requestedFolder = String(form.get('folder') || 'product')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .toLowerCase();
    const normalized = requestedFolder === 'products' ? 'product' : requestedFolder;
    const folder = normalized === 'category' ? 'category' : 'product';

    if (!file) {
      return NextResponse.json({ error: 'File missing' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-');
    const relativePath = `${folder}/${Date.now()}-${safeName}`;
    const url = await writeBufferToPublicUploads(relativePath, bytes);

    return NextResponse.json({ url, key: relativePath, local: true });
  } catch (e) {
    console.error('[UPLOAD_ERROR]', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
