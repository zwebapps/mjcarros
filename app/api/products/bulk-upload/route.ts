import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility
import { MongoClient } from 'mongodb';
import * as XLSX from 'xlsx';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { getMongoDbUri } from '@/lib/mongodb-connection';

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;
  
  try {
    // Check admin authorization using JWT token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      console.log('❌ No token provided for bulk upload');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token for bulk upload');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      console.log('❌ User is not admin for bulk upload:', decoded.role);
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    console.log('✅ Admin authorization verified for bulk upload');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 });
    }

    // Validate and process data
    const results = {
      success: 0,
      errors: [] as string[],
      created: [] as any[]
    };
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const categoriesCollection = db.collection('categories');
    
    // Get all categories for validation
    const categories = await categoriesCollection.find({}).toArray();
    const categoryMap = new Map(categories.map(cat => [cat.category.toLowerCase(), cat._id.toString()]));

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        const requiredFields = ['name', 'price', 'category', 'make', 'year', 'colour', 'model', 'mileage', 'fuelType'];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          results.errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
          continue;
        }

        // Validate category exists
        const categoryName = row.category.toString().toLowerCase();
        const categoryId = categoryMap.get(categoryName);
        
        if (!categoryId) {
          results.errors.push(`Row ${rowNumber}: Category "${row.category}" not found. Available categories: ${categories.map(c => c.category).join(', ')}`);
          continue;
        }

        // Validate price is a number
        const price = parseFloat(row.price);
        if (isNaN(price) || price <= 0) {
          results.errors.push(`Row ${rowNumber}: Invalid price "${row.price}". Must be a positive number.`);
          continue;
        }

        // Validate year is a number
        const year = parseInt(row.year);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          results.errors.push(`Row ${rowNumber}: Invalid year "${row.year}". Must be between 1900 and ${new Date().getFullYear() + 1}.`);
          continue;
        }

        // Validate mileage is a number
        const mileage = parseInt(row.mileage);
        if (isNaN(mileage) || mileage < 0) {
          results.errors.push(`Row ${rowNumber}: Invalid mileage "${row.mileage}". Must be a non-negative number.`);
          continue;
        }
        const productsCollection = db.collection('products');
        
        // Create product
        const productData = {
            title: row.name.toString().trim(),
            description: row.description?.toString().trim() || '',
            imageURLs: row.images ? row.images.toString().split(',').map((img: string) => img.trim()).filter(Boolean) : [],
            category: row.category.toString().trim(),
            categoryId: categoryId,
            price: price,
            featured: row.isFeatured === 'true' || row.isFeatured === true,
            modelName: row.make?.toString().trim() || '',
            year: year,
            color: row.colour?.toString().trim() || '',
            mileage: mileage,
            fuelType: row.fuelType?.toString().trim() || '',
            createdAt: new Date(),
            updatedAt: new Date()
          };

        const result = await productsCollection.insertOne(productData);
        const product = { ...productData, _id: result.insertedId };

        results.success++;
        results.created.push({
          id: product._id,
          title: product.title,
          modelName: product.modelName,
          year: product.year
        });

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} products created successfully.`,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Download Excel template
export async function GET() {
  try {
    // Create template data
    const templateData = [
      {
        name: 'BMW X5 2023',
        price: 75000,
        category: 'SUV',
        make: 'BMW',
        year: 2023,
        colour: 'Black',
        model: 'X5',
        mileage: 15000,
        fuelType: 'Petrol',
        vin: 'WBAFR7C50LC123456',
        deliveryDate: '2024-01-15',
        description: 'Luxury SUV with premium features',
        isFeatured: 'true',
        isArchived: 'false',
        images: 'https://example.com/image1.jpg,https://example.com/image2.jpg'
      },
      {
        name: 'Mercedes C-Class 2022',
        price: 55000,
        category: 'Sedan',
        make: 'Mercedes',
        year: 2022,
        colour: 'White',
        model: 'C-Class',
        mileage: 25000,
        fuelType: 'Petrol',
        vin: 'WDD2050461A123456',
        deliveryDate: '2024-02-01',
        description: 'Elegant sedan with advanced technology',
        isFeatured: 'false',
        isArchived: 'false',
        images: 'https://example.com/image3.jpg'
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Add instructions as comments or in a separate sheet
    const instructions = [
      ['Instructions:'],
      ['1. Fill in all required fields (marked with *)'],
      ['2. Category must match existing categories in the system'],
      ['3. Price, year, and mileage must be numbers'],
      ['4. Images should be comma-separated URLs'],
      ['5. isFeatured and isArchived should be "true" or "false"'],
      ['6. deliveryDate should be in YYYY-MM-DD format'],
      [''],
      ['Required Fields:'],
      ['* name - Product name'],
      ['* price - Product price (number)'],
      ['* category - Category name (must exist)'],
      ['* make - Car manufacturer'],
      ['* year - Manufacturing year (number)'],
      ['* colour - Car color'],
      ['* model - Car model'],
      ['* mileage - Car mileage (number)'],
      ['* fuelType - Fuel type (Petrol, Diesel, Electric, etc.)'],
      [''],
      ['Optional Fields:'],
      ['vin - Vehicle Identification Number'],
      ['deliveryDate - Delivery date (YYYY-MM-DD)'],
      ['description - Product description'],
      ['isFeatured - Featured product (true/false)'],
      ['isArchived - Archived product (true/false)'],
      ['images - Comma-separated image URLs']
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="car-upload-template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
