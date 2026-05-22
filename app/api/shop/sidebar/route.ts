import { NextResponse } from "next/server";
import { getShopSidebarData } from "@/lib/shop-sidebar-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getShopSidebarData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching shop sidebar:", error);
    return NextResponse.json(
      { error: "Failed to load shop filters" },
      { status: 500 }
    );
  }
}
