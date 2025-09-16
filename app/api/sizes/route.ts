import { db, insertOne, findMany } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const { categoryId, sizes } = await req.json();

  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const category = await db.category.findUnique({
      where: { _id: new ObjectId(categoryId ) },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" });
    }

    const createdSizes = await Promise.all(
      sizes.map(async (size: any) => {
        if (!db) {
          return NextResponse.json({ error: 'Database not found' }, { status: 500 });
        }
        return db.size.create({
          data: { name: size },
        });
      })
    );

    const categorySizeCreateManyInput = createdSizes.map((size) => ({
      categoryId,
      sizeId: size.id,
    }));

    const createdCategorySizes = await Promise.all(
      categorySizeCreateManyInput.map(async (input) => {
        if (!db) {
          return NextResponse.json({ error: 'Database not found' }, { status: 500 });
        }
        return insertOne('categorySize', input,
        );
      })
    );

    return NextResponse.json({
      createdCategorySizes,
      message: "Sizes added successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}

export async function GET(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const sizes = await findMany('size');
    return NextResponse.json(sizes);
  } catch (error) {
    return NextResponse.json({ error: "Error getting sizes.", status: 500 });
  }
}
