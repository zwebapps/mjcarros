import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany();
    const orders = await db.order.findMany();
    const usersCount = 0; // adjust if user listing is needed

    return NextResponse.json({ products, orders, usersCount });
  } catch (error) {
    console.error("Error building graph:", error);
    return NextResponse.json({ error: "Error building graph" }, { status: 500 });
  }
}
