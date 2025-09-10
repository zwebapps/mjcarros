const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

const prisma = new PrismaClient();

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function uploadImage(s3, bucket, key, buffer, contentType = 'image/jpeg') {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
}

async function main() {
  const bucket = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!bucket || !region) throw new Error('Set AWS bucket and region envs');
  const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, '');

  const s3 = new S3Client({ region, credentials: { accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY } });

  let category = await prisma.category.findFirst({ where: { category: 'sedan' } });
  if (!category) {
    const billboard = await prisma.billboard.create({ data: { billboard: 'Sedan', imageURL: `${baseUrl}/defaults/sedan.jpg` } });
    category = await prisma.category.create({ data: { category: 'sedan', billboard: billboard.billboard, billboardId: billboard.id } });
  }

  const cars = [
    { title: 'City Compact', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&fit=crop', price: 9000 },
    { title: 'Family Sedan', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&fit=crop', price: 12000 },
  ];

  for (const car of cars) {
    const buffer = await download(car.url);
    const key = `seed/${Date.now()}-${car.title.replace(/\s+/g, '-')}.jpg`;
    await uploadImage(s3, bucket, key, buffer);
    const imageURLs = [`${baseUrl}/${key}`];
    await prisma.product.create({
      data: {
        title: car.title,
        description: `${car.title} description`,
        imageURLs,
        category: category.category,
        categoryId: category.id,
        price: car.price,
        finalPrice: car.price,
        discount: 0,
        featured: false,
      },
    });
  }

  console.log('Seeded two cars with S3 images');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


