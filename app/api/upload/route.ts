import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // auth: admin only
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = String(form.get('folder') || 'products');
    const bucket = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : '')).replace(/\/$/, '');

    if (!file || !bucket) {
      return NextResponse.json({ error: 'File or bucket missing' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-');
    const key = `${folder}/${Date.now()}-${safeName}`;
    
    try {
      await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type || 'application/octet-stream' }));
      const url = baseUrl ? `${baseUrl}/${key}` : undefined;
      console.log(`✅ Successfully uploaded to S3: ${key}`);
      return NextResponse.json({ url, key });
    } catch (s3Error) {
      console.warn('⚠️ S3 upload failed, using local storage fallback:', s3Error instanceof Error ? s3Error.message : String(s3Error));
      
      // Fallback to local storage
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = '/app/public/uploads';
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, bytes);
      
      const localUrl = `/uploads/${fileName}`;
      console.log(`✅ Successfully saved locally: ${fileName}`);
      return NextResponse.json({ url: localUrl, key: fileName, local: true });
    }
  } catch (e) {
    console.error('[UPLOAD_ERROR]', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


