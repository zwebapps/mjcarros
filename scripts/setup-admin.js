const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { loadEnv } = require("./load-env");

loadEnv();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES_FALLBACK = [
  { name: "Luxury", description: "Luxury vehicles" },
  { name: "Sports", description: "High-performance sports cars" },
  { name: "SUV", description: "Sports Utility Vehicles" },
  { name: "Electric", description: "Electric vehicles" },
  { name: "Sedan", description: "Four-door passenger cars" },
];

const defaultCategoriesPath = path.join(__dirname, "..", "data", "default-categories.json");
let defaultCategoriesSeed;
try {
  defaultCategoriesSeed = JSON.parse(fs.readFileSync(defaultCategoriesPath, "utf8"));
} catch (e) {
  console.warn("⚠️ Using inline default categories:", e.message);
  defaultCategoriesSeed = DEFAULT_CATEGORIES_FALLBACK;
}

const defaultProductsPath = path.join(__dirname, "..", "data", "default-products.json");
let defaultProductsSeed;
try {
  defaultProductsSeed = JSON.parse(fs.readFileSync(defaultProductsPath, "utf8"));
} catch (e) {
  console.warn("⚠️ Using empty default products list:", e.message);
  defaultProductsSeed = [];
}

async function connectWithRetry(attempts = 15, delayMs = 3000) {
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Postgres connect attempt ${i}/${attempts} failed: ${e.message}`);
      if (i < attempts) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

async function setupAdmin() {
  try {
    console.log("🚀 Setting up MJ Carros (PostgreSQL + Prisma)...\n");

    if (!process.env.POSTGRES_PRISMA_URL) {
      console.error("❌ Set POSTGRES_PRISMA_URL in .env (postgresql://...@127.0.0.1:5432/...).");
      process.exit(1);
    }

    await connectWithRetry();

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword || !adminName) {
      console.error("❌ Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME.");
      process.exit(1);
    }

    console.log("1️⃣ Admin user...");
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    let adminUser;
    if (existingAdmin) {
      adminUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: "ADMIN",
          name: adminName,
          password: hashedPassword,
        },
      });
      console.log(`✅ Admin updated (password synced from ADMIN_PASSWORD): ${adminEmail}`);
    } else {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: "ADMIN",
        },
      });
      console.log(`✅ Admin created: ${adminEmail}`);
    }

    const testPassword = process.env.TEST_USER_PASSWORD;
    const testEmail = (process.env.TEST_USER_EMAIL || "test@mjcarros.com").toLowerCase();
    const testName = process.env.TEST_USER_NAME || "Test User";

    if (testPassword) {
      console.log("\n1️⃣.5️⃣ Test user...");
      const existingTest = await prisma.user.findUnique({ where: { email: testEmail } });
      if (!existingTest) {
        await prisma.user.create({
          data: {
            email: testEmail,
            password: await bcrypt.hash(testPassword, 12),
            name: testName,
            role: "USER",
          },
        });
        console.log(`✅ Test user created: ${testEmail}`);
      } else {
        console.log(`✅ Test user exists: ${testEmail}`);
      }
    }

    // Demo categories, products and billboards are for local/dev databases only.
    // In production they would appear on the live shop and are re-created on every
    // start, so they only run when SEED_DEMO_DATA=1 is set explicitly.
    if (process.env.SEED_DEMO_DATA === "1") {
      console.log("\n2️⃣ Default categories...");
      for (const categoryData of defaultCategoriesSeed) {
        const name = categoryData.name;
        const existing = await prisma.category.findUnique({ where: { category: name } });
        if (existing) {
          console.log(`✅ Category exists: ${name}`);
          continue;
        }

        const bb = await prisma.billboard.create({
          data: {
            billboard: `${name} Category`,
            imageURL: "/placeholder-image.svg",
          },
        });

        await prisma.category.create({
          data: {
            category: name,
            billboard: `${name} Category`,
            billboardId: bb.id,
          },
        });
        console.log(`✅ Category created: ${name}`);
      }

      console.log("\n2️⃣.5️⃣ Default products...");
      for (const p of defaultProductsSeed) {
        if (!p.seedKey || !p.category || !p.title) continue;

        const exists = await prisma.product.findUnique({ where: { seedKey: p.seedKey } });
        if (exists) {
          console.log(`✅ Default product exists: ${p.title}`);
          continue;
        }

        const cat = await prisma.category.findUnique({ where: { category: p.category } });
        if (!cat) {
          console.warn(`⚠️ Skip "${p.title}": category "${p.category}" not found`);
          continue;
        }

        const productCode = `PRD-${p.seedKey.slice(-6).toUpperCase()}`;
        await prisma.product.create({
          data: {
            seedKey: p.seedKey,
            productCode,
            title: p.title,
            description: p.description || "",
            imageURLs:
              Array.isArray(p.imageURLs) && p.imageURLs.length
                ? p.imageURLs
                : ["/placeholder-image.svg"],
            category: p.category,
            categoryId: cat.id,
            price: Number(p.price) || 0,
            finalPrice: p.finalPrice !== undefined ? Number(p.finalPrice) : Number(p.price) || 0,
            discount: p.discount !== undefined ? Number(p.discount) : 0,
            featured: !!p.featured,
            sold: !!p.sold,
            negotiable: !!p.negotiable,
            modelName: p.modelName || "",
            year: p.year ? Number(p.year) : 0,
            stockQuantity: p.stockQuantity !== undefined ? Number(p.stockQuantity) : 1,
            color: p.color || "",
            fuelType: p.fuelType || "",
            transmission: p.transmission || "",
            mileage:
              p.mileage !== undefined && p.mileage !== null ? Number(p.mileage) : null,
            condition: p.condition || "used",
          },
        });
        console.log(`✅ Seeded: ${p.title}`);
      }

      console.log("\n3️⃣ Sample billboards...");
      const sampleBillboards = [
        { billboard: "Premium Collection", imageURL: "/placeholder-image.svg" },
        { billboard: "New Arrivals", imageURL: "/placeholder-image.svg" },
        { billboard: "Luxury Vehicles", imageURL: "/placeholder-image.svg" },
      ];

      for (const billboardData of sampleBillboards) {
        const existing = await prisma.billboard.findFirst({
          where: { billboard: billboardData.billboard },
        });
        if (!existing) {
          await prisma.billboard.create({ data: billboardData });
          console.log(`✅ Billboard created: ${billboardData.billboard}`);
        } else {
          console.log(`✅ Billboard exists: ${billboardData.billboard}`);
        }
      }
    } else {
      console.log("\n2️⃣ Demo data skipped (set SEED_DEMO_DATA=1 to seed categories, products, billboards)");
    }

    console.log("\n4️⃣ Contact page...");
    const contactCount = await prisma.contactPage.count();
    if (contactCount === 0) {
      await prisma.contactPage.create({
        data: {
          heroTitle: "Contact MJ Carros",
          heroSubtitle: "Get in touch with our premium automotive experts",
          address1: "Majestic Journey Unipessoal LDA",
          cityLine:
            "Verdelhas - Vale Mourelos Espaco no. 1, 2815-729 Pontevedra, Portugal",
          phone: "+351 927508220",
          email: "majesticjourneypt@gmail.com",
          web: "www.mjcarros.pt",
          hours: "24/7 Customer Support",
        },
      });
      console.log("✅ Contact page created");
    } else {
      console.log("✅ Contact page already exists");
    }

    console.log("\n🎉 Setup complete!");
    console.log(`   Admin: ${adminUser.email}`);
    console.log(`   Categories seed: ${defaultCategoriesSeed.length}`);
    console.log(`   Products seed: ${defaultProductsSeed.length}`);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
