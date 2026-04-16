import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getMongoDbUri } = require('./mongo-uri.js');

type UploadKind = 'product' | 'category';                                             

function isS3Like(url: string): boolean {    
  return /amazonaws\.com/i.test(url) || /mjcarros-image-listing-of-products/i.test(url);
}

function stripQuery(url: string): string {
  return url.split('?')[0];
}

function extFromContentType(ct: string | null): string {
  if (!ct) return '.bin';
  if (ct.includes('image/jpeg')) return '.jpg';
  if (ct.includes('image/png')) return '.png';
  if (ct.includes('image/webp')) return '.webp';
  if (ct.includes('image/gif')) return '.gif';
  return '.bin';
}

async function downloadToUploads(url: string, kind: UploadKind): Promise<string | null> {
  const clean = stripQuery(url);
  const res = await fetch(clean);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type');
  const ext = extFromContentType(ct);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const fileName = `${Date.now()}-${hash}${ext}`;
  const rel = `${kind}/${fileName}`;
  const full = path.join(process.cwd(), 'public', 'uploads', rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return `/uploads/${rel}`;
}

async function migrateProducts(db: any) {
  const products = db.collection('products');
  const cursor = products.find({ imageURLs: { $exists: true, $type: 'array' } });
  let updated = 0;
  for await (const p of cursor) {
    const urls: string[] = Array.isArray(p.imageURLs) ? p.imageURLs : [];
    const newUrls: string[] = [];
    let changed = false;
    for (const u of urls) {
      if (typeof u === 'string' && u.startsWith('http') && isS3Like(u)) {
        const local = await downloadToUploads(u, 'product');
        if (local) {
          newUrls.push(local);
          changed = true;
          continue;
        }
      }
      newUrls.push(u);
    }
    if (changed) {
      await products.updateOne({ _id: p._id }, { $set: { imageURLs: newUrls, updatedAt: new Date() } });
      updated += 1;
    }
  }
  return updated;
}

async function migrateBillboards(db: any) {
  const billboards = db.collection('billboards');
  const cursor = billboards.find({ imageURL: { $exists: true, $type: 'string' } });
  let updated = 0;
  for await (const b of cursor) {
    const u = String(b.imageURL || '');
    if (u.startsWith('http') && isS3Like(u)) {
      const local = await downloadToUploads(u, 'category');
      if (local) {
        await billboards.updateOne({ _id: b._id }, { $set: { imageURL: local, updatedAt: new Date() } });
        updated += 1;
      }
    }
  }
  return updated;
}

async function main() {
  const uri = getMongoDbUri();
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGO_DATABASE || 'mjcarros';
  const db = client.db(dbName);

  const [p, b] = await Promise.all([migrateProducts(db), migrateBillboards(db)]);
  await client.close();
  console.log(`Migrated products: ${p}`);
  console.log(`Migrated billboards: ${b}`);
  console.log('Done. Local files saved under public/uploads/.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

