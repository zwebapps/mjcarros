import { NextRequest, NextResponse } from "next/server";
import { db, findMany } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // During build time, return mock data
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_AVAILABLE) {
      return NextResponse.json({ 
        products: [], 
        orders: [], 
        usersCount: 0 
      });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const products = await findMany('product');
    const orders = await findMany('order');
    const usersCount = 0; // adjust if user listing is needed

    return NextResponse.json({ products, orders, usersCount });
  } catch (error) {
    console.error("Error building graph:", error);
    // Return empty data on error instead of failing
    return NextResponse.json({ 
      products: [], 
      orders: [], 
      usersCount: 0 
    });
  }
}
