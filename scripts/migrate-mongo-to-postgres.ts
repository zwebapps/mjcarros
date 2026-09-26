/**
 * One-time migration: MongoDB → PostgreSQL (Prisma).
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." POSTGRES_PRISMA_URL="postgresql://..." npm run migrate:mongo-to-postgres
 *
 * Optional: DRY_RUN=1 to log counts without writing.
 */
import { MongoClient, ObjectId } from "mongodb";
import { PrismaClient, UserRole, ImportStatus } from "@prisma/client";

const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

function mongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const { getMongoDbUri } = require("./mongo-uri") as { getMongoDbUri: () => string };
  return getMongoDbUri();
}

function mongoDbName(): string {
  if (process.env.MONGO_DATABASE) return process.env.MONGO_DATABASE;
  const u = new URL(mongoUri());
  return u.pathname.replace(/^\//, "").split("/")[0] || "mjcarros";
}

function toUserRole(role: unknown): UserRole {
  const r = String(role || "USER").toUpperCase();
  if (r === "ADMIN") return "ADMIN";
  if (r === "CUSTOMER") return "CUSTOMER";
  if (r === "DEALER") return "DEALER";
  return "USER";
}

async function main() {
  const prisma = new PrismaClient();
  const client = new MongoClient(mongoUri());
  await client.connect();
  const db = client.db(mongoDbName());

  const idMap = {
    users: new Map<string, string>(),
    billboards: new Map<string, string>(),
    categories: new Map<string, string>(),
    products: new Map<string, string>(),
    orders: new Map<string, string>(),
    sizes: new Map<string, string>(),
  };

  console.log(`Mongo DB: ${mongoDbName()} | dryRun=${dryRun}`);

  const users = await db.collection("users").find({}).toArray();
  console.log(`users: ${users.length}`);
  for (const doc of users) {
    const legacy = doc._id.toString();
    const email = String(doc.email || "").toLowerCase();
    if (!email) continue;

    if (dryRun) {
      idMap.users.set(legacy, legacy);
      continue;
    }

    const byLegacy = await prisma.user.findFirst({ where: { legacyMongoId: legacy } });
    const byEmail = await prisma.user.findUnique({ where: { email } });
    const data = {
      legacyMongoId: legacy,
      email,
      password: String(doc.password || ""),
      name: String(doc.name || ""),
      role: toUserRole(doc.role),
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };

    let row;
    if (byLegacy) {
      row = await prisma.user.update({ where: { id: byLegacy.id }, data });
    } else if (byEmail) {
      row = await prisma.user.update({ where: { id: byEmail.id }, data });
    } else {
      row = await prisma.user.create({ data });
    }
    idMap.users.set(legacy, row.id);
  }

  const billboards = await db.collection("billboards").find({}).toArray();
  console.log(`billboards: ${billboards.length}`);
  for (const doc of billboards) {
    const legacy = doc._id.toString();
    const label = String(doc.billboard || doc.label || "Billboard");
    if (dryRun) {
      idMap.billboards.set(legacy, legacy);
      continue;
    }
    const row = await prisma.billboard.upsert({
      where: { legacyMongoId: legacy },
      create: {
        legacyMongoId: legacy,
        billboard: label,
        imageURL: String(doc.imageURL || "/placeholder-image.svg"),
        createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      },
      update: { billboard: label, imageURL: String(doc.imageURL || "/placeholder-image.svg") },
    });
    idMap.billboards.set(legacy, row.id);
  }

  const categories = await db.collection("categories").find({}).toArray();
  console.log(`categories: ${categories.length}`);
  for (const doc of categories) {
    const legacy = doc._id.toString();
    const name = String(doc.category || "").trim();
    if (!name) continue;

    let billboardId: string | null = null;
    const bbLegacy = doc.billboardId ? String(doc.billboardId) : null;
    if (bbLegacy && idMap.billboards.has(bbLegacy)) {
      billboardId = idMap.billboards.get(bbLegacy)!;
    }

    if (dryRun) {
      idMap.categories.set(legacy, legacy);
      continue;
    }

    // A category with the same name may already exist (e.g. created by setup-admin);
    // adopt it instead of failing on the unique name.
    const sameName = await prisma.category.findUnique({ where: { category: name } });
    if (sameName?.legacyMongoId && sameName.legacyMongoId !== legacy) {
      // Mongo holds two categories with this name; Postgres keeps one and both
      // legacy ids resolve to it, so every product still finds its category.
      console.log(`↪ duplicate category "${name}" (${legacy}) merged into ${sameName.legacyMongoId}`);
      idMap.categories.set(legacy, sameName.id);
      continue;
    }
    const row = await prisma.category.upsert({
      where: sameName && !sameName.legacyMongoId ? { id: sameName.id } : { legacyMongoId: legacy },
      create: {
        legacyMongoId: legacy,
        category: name,
        billboard: String(doc.billboard || name),
        billboardId,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      },
      update: {
        legacyMongoId: legacy,
        category: name,
        billboard: String(doc.billboard || name),
        billboardId,
      },
    });
    idMap.categories.set(legacy, row.id);
  }

  const products = await db.collection("products").find({}).toArray();
  console.log(`products: ${products.length}`);
  for (const doc of products) {
    const legacy = doc._id.toString();
    const catLegacy = doc.categoryId ? String(doc.categoryId) : null;
    let categoryId = catLegacy && idMap.categories.has(catLegacy) ? idMap.categories.get(catLegacy)! : null;

    if (!categoryId && doc.category) {
      const byName = await prisma.category.findUnique({
        where: { category: String(doc.category) },
      });
      categoryId = byName?.id ?? null;
    }

    if (!categoryId) {
      const fallback = await prisma.category.findFirst();
      categoryId = fallback?.id ?? null;
    }
    if (!categoryId) {
      console.warn(`⚠️ Skip product ${legacy}: no category`);
      continue;
    }

    const categoryName = String(doc.category || "");
    const imageURLs = Array.isArray(doc.imageURLs) ? doc.imageURLs.map(String) : [];

    if (dryRun) {
      idMap.products.set(legacy, legacy);
      continue;
    }

    const row = await prisma.product.upsert({
      where: { legacyMongoId: legacy },
      create: {
        legacyMongoId: legacy,
        seedKey: doc.seedKey ? String(doc.seedKey) : undefined,
        productCode: doc.productCode ? String(doc.productCode) : undefined,
        title: String(doc.title || "Untitled"),
        description: String(doc.description || ""),
        imageURLs,
        category: categoryName,
        categoryId,
        price: Number(doc.price) || 0,
        finalPrice: doc.finalPrice != null ? Number(doc.finalPrice) : undefined,
        discount: doc.discount != null ? Number(doc.discount) : undefined,
        featured: !!doc.featured,
        hidden: doc.hidden === true,
        sold: !!doc.sold,
        negotiable: !!doc.negotiable,
        modelName: doc.modelName ? String(doc.modelName) : undefined,
        year: doc.year != null ? Number(doc.year) : undefined,
        stockQuantity: doc.stockQuantity != null ? Number(doc.stockQuantity) : 1,
        color: doc.color ? String(doc.color) : undefined,
        fuelType: doc.fuelType ? String(doc.fuelType) : undefined,
        transmission: doc.transmission ? String(doc.transmission) : undefined,
        mileage: doc.mileage != null ? Number(doc.mileage) : undefined,
        condition: doc.condition ? String(doc.condition) : "used",
        vin: doc.vin ? String(doc.vin) : undefined,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      },
      update: {
        title: String(doc.title || "Untitled"),
        description: String(doc.description || ""),
        imageURLs,
        category: categoryName,
        categoryId,
        price: Number(doc.price) || 0,
        sold: !!doc.sold,
        featured: !!doc.featured,
        hidden: doc.hidden === true,
      },
    });
    idMap.products.set(legacy, row.id);
  }

  const orders = await db.collection("orders").find({}).toArray();
  console.log(`orders: ${orders.length}`);
  for (const doc of orders) {
    const legacy = doc._id.toString();
    const orderNumber = Number(doc.orderNumber) || 0;
    if (!orderNumber) {
      console.warn(`⚠️ Skip order ${legacy}: missing orderNumber`);
      continue;
    }

    if (dryRun) {
      idMap.orders.set(legacy, legacy);
      continue;
    }

    const order = await prisma.order.upsert({
      where: { legacyMongoId: legacy },
      create: {
        legacyMongoId: legacy,
        orderNumber,
        isPaid: !!doc.isPaid,
        userEmail: String(doc.userEmail || ""),
        phone: String(doc.phone || ""),
        address: String(doc.address || ""),
        paymentMethod: doc.paymentMethod ? String(doc.paymentMethod) : undefined,
        paymentIntentId: doc.paymentIntentId ? String(doc.paymentIntentId) : undefined,
        transactionId: doc.transactionId ? String(doc.transactionId) : undefined,
        checkoutSessionId: doc.checkoutSessionId ? String(doc.checkoutSessionId) : undefined,
        notificationSent: !!doc.notificationSent,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      },
      update: {
        isPaid: !!doc.isPaid,
        userEmail: String(doc.userEmail || ""),
        phone: String(doc.phone || ""),
        address: String(doc.address || ""),
      },
    });
    idMap.orders.set(legacy, order.id);

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

    const items = Array.isArray(doc.orderItems) ? doc.orderItems : [];
    for (const item of items) {
      const itemLegacy = item._id ? String(item._id) : undefined;
      let productId: string | undefined;
      if (item.productId) {
        const pl = String(item.productId);
        productId = idMap.products.get(pl);
        if (!productId && ObjectId.isValid(pl)) {
          const p = await prisma.product.findFirst({ where: { legacyMongoId: pl } });
          productId = p?.id;
        }
      }

      await prisma.orderItem.create({
        data: {
          legacyMongoId: itemLegacy,
          orderId: order.id,
          productId,
          productName: String(item.productName || item.name || "Product"),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        },
      });
    }
  }

  const contactColl =
    (await db.collection("contactPages").countDocuments()) > 0
      ? "contactPages"
      : "contactPage";
  const contacts = await db.collection(contactColl).find({}).toArray();
  console.log(`contact pages: ${contacts.length}`);
  if (!dryRun && contacts.length > 0) {
    const doc = contacts[0];
    const existing = await prisma.contactPage.findFirst();
    const data = {
      heroTitle: String(doc.heroTitle || "Contact Us"),
      heroSubtitle: String(doc.heroSubtitle || ""),
      address1: String(doc.address1 || doc.address || ""),
      cityLine: String(doc.cityLine || ""),
      phone: String(doc.phone || ""),
      email: String(doc.email || ""),
      web: String(doc.web || ""),
      hours: String(doc.hours || ""),
    };
    if (existing) {
      await prisma.contactPage.update({ where: { id: existing.id }, data });
    } else {
      await prisma.contactPage.create({
        data: { ...data, legacyMongoId: doc._id?.toString() },
      });
    }
  }

  const sizes = await db.collection("sizes").find({}).toArray();
  console.log(`sizes: ${sizes.length}`);
  for (const doc of sizes) {
    const legacy = doc._id.toString();
    const name = String(doc.name || "").trim();
    if (!name) continue;
    if (dryRun) {
      idMap.sizes.set(legacy, legacy);
      continue;
    }
    const row = await prisma.size.upsert({
      where: { name },
      create: { legacyMongoId: legacy, name },
      update: {},
    });
    idMap.sizes.set(legacy, row.id);
  }

  console.log("\n✅ Migration finished.");
  console.log("Postgres counts:");
  if (!dryRun) {
    console.log({
      users: await prisma.user.count(),
      billboards: await prisma.billboard.count(),
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      contactPages: await prisma.contactPage.count(),
      sizes: await prisma.size.count(),
    });
  }

  await client.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
