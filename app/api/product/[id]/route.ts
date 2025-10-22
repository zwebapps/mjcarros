import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export const runtime = 'nodejs';


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
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection('products');
    
    // Find the product by _id
    const product = await productsCollection.findOne({ _id: new ObjectId(params.id) });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Find related products (same category, excluding current product)
    const relatedProducts = await productsCollection
      .find({ 
        category: product.category, 
        _id: { $ne: new ObjectId(params.id) } 
      })
      .limit(4)
      .toArray();

    // Transform the product to include id field for compatibility
    const transformedProduct = {
      ...product,
      id: product._id.toString(),
      productCode: (product as any).productCode || `PRD-${product._id.toString().slice(-6).toUpperCase()}`,
      sold: !!(product as any).sold
    };

    // Transform related products
    const transformedRelatedProducts = relatedProducts.map(relatedProduct => ({
      ...relatedProduct,
      id: relatedProduct._id.toString()
    }));

    return NextResponse.json({ 
      product: transformedProduct, 
      relatedProducts: transformedRelatedProducts 
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    // Admin guard with JWT fallback
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null as any;
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection('products');
    
    // Delete the product
    const result = await productsCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
