import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ui/product-card";

// Real products from database - these will actually work when clicked
const featuredProducts = [
  {
    id: "cmf4g40lr0005yd4erj60ypqi",
    title: "2024 Mercedes-Benz S-Class",
    price: 125000,
    finalPrice: 118000,
    discount: 5.6,
    imageURLs: ["https://images.unsplash.com/photo-1618843479618-39b0bb21ab70?w=400&h=300&fit=crop"],
    category: "Luxury",
    featured: true
  },
  {
    id: "cmf4g40mr0006yd4e8s90rvfy",
    title: "2024 Porsche 911 GT3",
    price: 165000,
    imageURLs: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop"],
    category: "Sports",
    featured: true
  },
  {
    id: "cmf4g40ng0007yd4e7fndy2ae",
    title: "2024 BMW X7 M60i",
    price: 98000,
    finalPrice: 92000,
    discount: 6.1,
    imageURLs: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"],
    category: "SUV",
    featured: false
  },
  {
    id: "cmf4g40o50008yd4ekyyv02by",
    title: "2024 Tesla Model S Plaid",
    price: 89000,
    finalPrice: 85000,
    discount: 4.5,
    imageURLs: ["https://images.unsplash.com/photo-1593941707882-a5bacd19c84b?w=400&h=300&fit=crop"],
    category: "Electric",
    featured: true
  }
];

// Dummy data for banners
const banners = [
  {
    id: "1",
    title: "Summer Sale",
    subtitle: "Up to 40% off on selected vehicles",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
    cta: "Shop Now",
    link: "/shop"
  },
  {
    id: "2",
    title: "New Arrivals",
    subtitle: "Latest 2024 models available",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=400&fit=crop",
    cta: "Explore",
    link: "/featured"
  }
];

// Build categories dynamically from products
async function getCategoriesWithCounts() {
  // During build time, return fallback categories if DB is not available
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_AVAILABLE) {
    return [
      { name: "Luxury", count: 15, image: "https://images.unsplash.com/photo-1618843479618-39b0bb21ab70?w=200&h=150&fit=crop" },
      { name: "Sports", count: 12, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop" },
      { name: "SUV", count: 20, image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=150&fit=crop" },
      { name: "Electric", count: 8, image: "https://images.unsplash.com/photo-1593941707882-a5bacd19c84b?w=200&h=150&fit=crop" },
    ];
  }

  let client;
  
  try {
    const { MongoClient } = await import('mongodb');
    const { getMongoDbUri } = await import('@/lib/mongodb-connection');
    const MONGODB_URI = getMongoDbUri();
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).sort({ category: 1 }).toArray();
    
    const map = new Map<string, { count: number; image?: string }>();
    for (const p of products) {
      const key = (p.category || "").trim();
      const current = map.get(key) || { count: 0, image: undefined };
      current.count += 1;
      if (!current.image && Array.isArray(p.imageURLs) && p.imageURLs.length > 0) {
        current.image = p.imageURLs[0];
      }
      map.set(key, current);
    }
    
    // Convert to array and provide fallback images
    const fallback = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=150&fit=crop";
    return Array.from(map.entries())
      .map(([name, { count, image }]) => ({ name, count, image: image || fallback }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return fallback categories on error
    return [
      { name: "Luxury", count: 15, image: "https://images.unsplash.com/photo-1618843479618-39b0bb21ab70?w=200&h=150&fit=crop" },
      { name: "Sports", count: 12, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop" },
      { name: "SUV", count: 20, image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=150&fit=crop" },
      { name: "Electric", count: 8, image: "https://images.unsplash.com/photo-1593941707882-a5bacd19c84b?w=200&h=150&fit=crop" },
    ];
  } finally {
    if (client) {
      await client.close();
    }
  }
}

const HomePage = async () => {
  const categories = await getCategoriesWithCounts();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero with background slider */}
      <div className="relative text-white h-[70vh]">
        <div className="absolute inset-0 overflow-hidden h-full">
          <div className="hero-slideshow h-full w-full">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=800&fit=crop')] bg-cover bg-center opacity-100"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&h=800&fit=crop')] bg-cover bg-center opacity-0"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&h=800&fit=crop')] bg-cover bg-center opacity-0"></div>
          </div>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Your Next Car, Simplified</h1>
            <p className="text-xl mb-8 opacity-90">Intelligent search, trusted listings, seamless checkout.</p>
            <div className="flex justify-center space-x-4">
              <Link href="/shop">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400">Browse Cars</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" className="bg-black text-white hover:bg-black/90">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find the perfect vehicle for your needs</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} href={`/shop/${category.name.toLowerCase()}`}>
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm opacity-90">{category.count} vehicles</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Vehicles</h2>
          <p className="text-lg text-gray-600">Handpicked cars for our valued customers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/shop">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400">
              View All Vehicles
            </Button>
          </Link>
        </div>
      </div>

      {/* Promotional Banners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {banners.map((banner) => (
            <div key={banner.id} className="relative overflow-hidden rounded-xl shadow-lg">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                <p className="text-lg mb-4 opacity-90">{banner.subtitle}</p>
                <Link href={banner.link}>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                    {banner.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Car?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who found their perfect vehicle with us
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-black text-white hover:bg-black/90">
                Get Started
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400">
                Browse Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
