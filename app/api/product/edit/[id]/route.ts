import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";
import { ObjectId } from "mongodb";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();
const dbName = getMongoDbName();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    const product = await productsCollection.findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Add id field for compatibility
    const productWithId = {
      ...product,
      id: product._id.toString(),
      sold: !!(product as any).sold
    };
    
    return NextResponse.json(productWithId);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    // Admin guard with JWT
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');
    const formData = await request.formData();
    const hasField = (key: string) => formData.has(key);
    const name = String(formData.get("name") || "");
    const price = Number(formData.get("price") || 0);
    const discountRaw = formData.get("discount");
    const discount = discountRaw !== null && String(discountRaw).length > 0 ? Number(discountRaw) : null;
    const finalPriceRaw = formData.get("finalPrice");
    const finalPrice = finalPriceRaw !== null && String(finalPriceRaw).length > 0 ? Number(finalPriceRaw) : null;
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "");
    const parseBool = (v: FormDataEntryValue | null): boolean => {
      if (v == null) return false;
      const s = String(v).toLowerCase();
      return s === 'true' || s === 'on' || s === '1' || s === 'yes' || s === 'checked';
    };
    const isFeatured = parseBool(formData.get("isFeatured"));
    const isSold = parseBool(formData.get("isSold"));
    const isNegotiable = parseBool(formData.get("negotiable"));
    const productSizesRaw = String(formData.get("productSizes") || "[]");
    // New fields
    const modelName = String(formData.get("modelName") || "");
    const year = Number(formData.get("year") || 0);
    const stockQuantity = Number(formData.get("stockQuantity") || 1);
    const color = String(formData.get("color") || "");
    const fuelType = String(formData.get("fuelType") || "");
    const transmission = String(formData.get("transmission") || "");
    const mileageRaw = formData.get("mileage");
    const mileage = mileageRaw !== null && String(mileageRaw).length > 0 ? Number(mileageRaw) : null;
    const condition = String(formData.get("condition") || "");

    let categoryIdUpdate: string | undefined = undefined;
    if (hasField('category')) {
      const cat = await categoriesCollection.findOne({ category });
      if (cat) categoryIdUpdate = cat._id.toString();
    }

    // Load existing product to append gallery images
    const existing = await productsCollection.findOne({ _id: new ObjectId(params.id) });
    const newFiles = formData.getAll('image') as File[];
    // Client may send the final image list as existingImageURLs
    const existingImagesRaw = formData.get('existingImageURLs');
    const existingImages: string[] | null = existingImagesRaw ? JSON.parse(String(existingImagesRaw)) : null;
    let newUrls: string[] = [];
    
    if (newFiles.length > 0) {
      try {
        for (const file of newFiles) {
          if (!file) continue;
          const bytes = Buffer.from(await file.arrayBuffer());
          const safe = String(file.name).replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '');
          const relativePath = `product/${Date.now()}-${safe || 'image'}`;
          const url = await writeBufferToPublicUploads(relativePath, bytes);
          newUrls.push(url);
        }
      } catch (localError) {
        console.warn('⚠️ Upload failed:', localError instanceof Error ? localError.message : String(localError));
      }
    }

    // Decide final gallery URLs
    // If client provided existingImageURLs, treat it as the final list and ignore newly uploaded files.
    // Otherwise, append any newly uploaded files to the current ones.
    let combinedUrls: string[] | undefined;
    if (existingImages !== null) {
      combinedUrls = existingImages;
    } else if (newUrls.length && existing) {
      combinedUrls = [...(existing.imageURLs || []), ...newUrls];
    } else if (newUrls.length) {
      combinedUrls = newUrls;
    }

    // Prepare update data using field presence (not truthiness)
    const setData: any = { updatedAt: new Date(), featured: isFeatured, sold: isSold, negotiable: isNegotiable };
    const unsetData: any = {};

    if (hasField('name')) setData.title = name;
    if (hasField('price')) setData.price = price;
    if (hasField('discount')) {
      if (discountRaw !== null && String(discountRaw).length > 0) setData.discount = discount;
      else unsetData.discount = "";
    }
    if (hasField('finalPrice')) {
      if (finalPriceRaw !== null && String(finalPriceRaw).length > 0) setData.finalPrice = finalPrice;
      else unsetData.finalPrice = "";
    }
    if (hasField('description')) setData.description = description;
    if (hasField('category')) setData.category = category;
    if (hasField('category') && categoryIdUpdate) setData.categoryId = categoryIdUpdate;
    if (hasField('modelName')) setData.modelName = modelName;
    if (hasField('year')) setData.year = year;
    if (hasField('stockQuantity')) setData.stockQuantity = stockQuantity > 0 ? stockQuantity : 1;
    if (hasField('color')) setData.color = color;
    if (hasField('fuelType')) setData.fuelType = fuelType;
    if (hasField('transmission')) setData.transmission = transmission;
    if (hasField('mileage')) {
      if (mileageRaw !== null && String(mileageRaw).length > 0) setData.mileage = mileage;
      else unsetData.mileage = "";
    }
    if (hasField('condition')) setData.condition = condition || 'new';
    if (combinedUrls !== undefined) {
      const sanitized = combinedUrls
        .map((u) => typeof u === 'string' ? u.trim() : u)
        .filter((u): u is string => typeof u === 'string' && u.length > 0 && !u.endsWith('-'));
      const unique = Array.from(new Set(sanitized));
      setData.imageURLs = unique;
    }

    // Ensure a human-friendly productCode is set once
    const existingProduct = existing || await productsCollection.findOne({ _id: new ObjectId(params.id) });
    if (existingProduct && !existingProduct.productCode) {
      setData.productCode = `PRD-${String(params.id).slice(-6).toUpperCase()}`;
    }

    // Update main product fields
    const updateOps: any = { $set: setData };
    if (Object.keys(unsetData).length > 0) updateOps.$unset = unsetData;
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      updateOps
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get the updated product
    const refreshed = await productsCollection.findOne({ _id: new ObjectId(params.id) });
    
    if (!refreshed) {
      return NextResponse.json({ error: "Product not found after update" }, { status: 404 });
    }

    // Add id field for compatibility
    const productWithId = {
      ...refreshed,
      id: refreshed._id.toString()
    };

    return NextResponse.json(productWithId);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    const result = await productsCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
