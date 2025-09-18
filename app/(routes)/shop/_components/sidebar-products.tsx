import { MongoClient } from "mongodb";
import SidebarItems from "./sidebar-items";
import PriceInput from "./price-input";
import { Product as UIProduct } from "@/types";
import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

const SidebarProducts = async () => {
  // During build time, return fallback data if DB is not available
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_AVAILABLE) {
    const fallbackCategories = [
      { id: "1", category: "Luxury", count: 15 },
      { id: "2", category: "Sports", count: 12 },
      { id: "3", category: "SUV", count: 20 },
      { id: "4", category: "Electric", count: 8 },
    ];
    const fallbackProducts: UIProduct[] = [];
    
    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems categories={fallbackCategories} totalCount={55} />
        </div>
        <div>
          <PriceInput data={fallbackProducts} />
        </div>
      </div>
    );
  }

  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const categoriesCollection = db.collection('categories');
    const productsCollection = db.collection('products');
    
    const [dbCategories, dbProducts] = await Promise.all([
      categoriesCollection.find({}).toArray(),
      productsCollection.find({}).toArray(),
    ]);

    const products: UIProduct[] = dbProducts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      price: p.price,
      finalPrice: p.finalPrice || undefined,
      discount: p.discount || undefined,
      featured: p.featured,
      imageURLs: p.imageURLs,
      category: p.category,
      categoryId: p.categoryId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    // Compute counts per category based on products
    const categoryToCount: Record<string, number> = products.reduce((acc, product) => {
      const key = product.category;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoriesWithCount = dbCategories.map((c) => ({
      id: c._id.toString(),
      category: c.category,
      count: categoryToCount[c.category] || 0,
    }));

    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems categories={categoriesWithCount} totalCount={products.length} />
        </div>
        <div>
          <PriceInput data={products} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching sidebar data:', error);
    // Return fallback data on error
    const fallbackCategories = [
      { id: "1", category: "Luxury", count: 15 },
      { id: "2", category: "Sports", count: 12 },
      { id: "3", category: "SUV", count: 20 },
      { id: "4", category: "Electric", count: 8 },
    ];
    const fallbackProducts: UIProduct[] = [];
    
    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems categories={fallbackCategories} totalCount={55} />
        </div>
        <div>
          <p>Price filter unavailable</p>
        </div>
      </div>
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
};

export default SidebarProducts;
