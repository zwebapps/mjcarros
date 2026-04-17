/**
 * Seed two sample products with images stored under public/uploads/seed/ (no S3).
 * Requires DATABASE_URL or MONGO_* (see scripts/mongo-uri.js).
 */
const https = require('https');
const path = require('path');
const fs = require('fs').promises;
const { MongoClient, ObjectId } = require('mongodb');
const { getMongoDbUri } = require('./mongo-uri');

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
      })
      .on('error', reject);
  });
}

async function main() {
  const uri = getMongoDbUri();
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGO_DATABASE;
  const db = client.db(dbName);

  let cat = await db.collection('categories').findOne({ category: { $regex: /^sedan$/i } });
  if (!cat) {
    const bb = await db.collection('billboards').insertOne({
      billboard: 'Sedan',
      imageURL: '/placeholder-image.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const r = await db.collection('categories').insertOne({
      category: 'sedan',
      billboard: 'Sedan',
      billboardId: bb.insertedId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    cat = await db.collection('categories').findOne({ _id: r.insertedId });
  }

  const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'seed');
  await fs.mkdir(uploadsRoot, { recursive: true });

  const cars = [
    {
      title: 'City Compact',
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&fit=crop',
      price: 9000,
    },
    {
      title: 'Family Sedan',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&fit=crop',
      price: 12000,
    },
  ];

  for (const car of cars) {
    const buffer = await download(car.url);
    const fileName = `${Date.now()}-${car.title.replace(/\s+/g, '-')}.jpg`;
    await fs.writeFile(path.join(uploadsRoot, fileName), buffer);
    const imageURLs = [`/uploads/seed/${fileName}`];
    await db.collection('products').insertOne({
      _id: new ObjectId(),
      title: car.title,
      description: `${car.title} — seeded sample`,
      imageURLs,
      category: cat.category,
      categoryId: cat._id.toString(),
      price: car.price,
      finalPrice: car.price,
      discount: 0,
      featured: false,
      sold: false,
      negotiable: false,
      modelName: car.title,
      year: new Date().getFullYear(),
      stockQuantity: 1,
      color: '',
      fuelType: '',
      transmission: '',
      mileage: null,
      condition: 'used',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log('Seeded two cars with images in public/uploads/seed/');
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
