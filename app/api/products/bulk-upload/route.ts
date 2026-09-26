import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data found in Excel file" }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[],
      created: [] as { id: string; title: string; modelName: string; year: number }[],
    };

    const categories = await prisma.category.findMany();
    const categoryMap = new Map(
      categories.map((cat: (typeof categories)[number]) => [
        cat.category.toLowerCase(),
        cat.id,
      ])
    );

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNumber = i + 2;

      try {
        const requiredFields = [
          "name",
          "price",
          "category",
          "make",
          "year",
          "colour",
          "model",
          "mileage",
          "fuelType",
        ];
        const missingFields = requiredFields.filter((field) => !row[field]);

        if (missingFields.length > 0) {
          results.errors.push(
            `Row ${rowNumber}: Missing required fields: ${missingFields.join(", ")}`
          );
          continue;
        }

        const categoryName = String(row.category).toLowerCase();
        const categoryId = categoryMap.get(categoryName);

        if (!categoryId) {
          results.errors.push(
            `Row ${rowNumber}: Category "${row.category}" not found. Available categories: ${categories.map((c: (typeof categories)[number]) => c.category).join(", ")}`
          );
          continue;
        }

        const price = parseFloat(String(row.price));
        if (isNaN(price) || price <= 0) {
          results.errors.push(
            `Row ${rowNumber}: Invalid price "${row.price}". Must be a positive number.`
          );
          continue;
        }

        const year = parseInt(String(row.year));
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          results.errors.push(
            `Row ${rowNumber}: Invalid year "${row.year}". Must be between 1900 and ${new Date().getFullYear() + 1}.`
          );
          continue;
        }

        const mileage = parseInt(String(row.mileage));
        if (isNaN(mileage) || mileage < 0) {
          results.errors.push(
            `Row ${rowNumber}: Invalid mileage "${row.mileage}". Must be a non-negative number.`
          );
          continue;
        }

        const catRow = categories.find((c: (typeof categories)[number]) => c.id === categoryId)!;
        const rowImages = row.images
          ? String(row.images)
              .split(",")
              .map((img) => img.trim())
              .filter(Boolean)
          : [];

        const product = await prisma.product.create({
          data: {
            title: String(row.name).trim(),
            description: row.description ? String(row.description).trim() : "",
            imageURLs: rowImages,
            category: catRow.category,
            categoryId,
            price,
            featured: row.isFeatured === "true" || row.isFeatured === true,
            modelName: row.make ? String(row.make).trim() : "",
            year,
            color: row.colour ? String(row.colour).trim() : "",
            mileage,
            fuelType: row.fuelType ? String(row.fuelType).trim() : "",
          },
        });

        const productCode = `PRD-${product.id.slice(-6).toUpperCase()}`;
        await prisma.product.update({
          where: { id: product.id },
          data: { productCode },
        });

        const serialized = withMongoId(product);
        results.success++;
        results.created.push({
          id: serialized._id,
          title: product.title,
          modelName: product.modelName || "",
          year: product.year || year,
        });
      } catch (error) {
        results.errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} products created successfully.`,
      results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateData = [
      {
        name: "BMW X5 2023",
        price: 75000,
        category: "SUV",
        make: "BMW",
        year: 2023,
        colour: "Black",
        model: "X5",
        mileage: 15000,
        fuelType: "Petrol",
        vin: "WBAFR7C50LC123456",
        deliveryDate: "2024-01-15",
        description: "Luxury SUV with premium features",
        isFeatured: "true",
        isArchived: "false",
        images: "https://example.com/image1.jpg,https://example.com/image2.jpg",
      },
      {
        name: "Mercedes C-Class 2022",
        price: 55000,
        category: "Sedan",
        make: "Mercedes",
        year: 2022,
        colour: "White",
        model: "C-Class",
        mileage: 25000,
        fuelType: "Petrol",
        vin: "WDD2050461A123456",
        deliveryDate: "2024-02-01",
        description: "Elegant sedan with advanced technology",
        isFeatured: "false",
        isArchived: "false",
        images: "https://example.com/image3.jpg",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    const instructions = [
      ["Instructions:"],
      ["1. Fill in all required fields (marked with *)"],
      ["2. Category must match existing categories in the system"],
      ["3. Price, year, and mileage must be numbers"],
      ["4. Images should be comma-separated URLs"],
      ["5. isFeatured and isArchived should be \"true\" or \"false\""],
      ["6. deliveryDate should be in YYYY-MM-DD format"],
      [""],
      ["Required Fields:"],
      ["* name - Product name"],
      ["* price - Product price (number)"],
      ["* category - Category name (must exist)"],
      ["* make - Car manufacturer"],
      ["* year - Manufacturing year (number)"],
      ["* colour - Car color"],
      ["* model - Car model"],
      ["* mileage - Car mileage (number)"],
      ["* fuelType - Fuel type (Petrol, Diesel, Electric, etc.)"],
      [""],
      ["Optional Fields:"],
      ["vin - Vehicle Identification Number"],
      ["deliveryDate - Delivery date (YYYY-MM-DD)"],
      ["description - Product description"],
      ["isFeatured - Featured product (true/false)"],
      ["isArchived - Archived product (true/false)"],
      ["images - Comma-separated image URLs"],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);

    XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="car-upload-template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
