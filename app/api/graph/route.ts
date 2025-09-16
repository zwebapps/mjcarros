import { NextRequest, NextResponse } from "next/server";
import { db, findMany } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const products = await findMany('product');
    const orders = await findMany('order');
    const usersCount = 0; // adjust if user listing is needed

    return NextResponse.json({ products, orders, usersCount });
  } catch (error) {
    console.error("Error building graph:", error);
    return NextResponse.json({ error: "Error building graph" }, { status: 500 });
  }
}
