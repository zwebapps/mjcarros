const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const categoryName = process.env.CAR_CATEGORY || 'sedan';

  let category = await prisma.category.findFirst({ where: { category: categoryName } });
  if (!category) {
    // Ensure a billboard exists to satisfy required fields
    const billboard = await prisma.billboard.create({
      data: {
        billboard: `${categoryName.toUpperCase()} Banner`,
        imageURL: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1600&h=900&fit=crop',
      },
    });

    category = await prisma.category.create({
      data: {
        category: categoryName,
        billboard: billboard.billboard,
        billboardId: billboard.id,
      },
    });
  }

  const product = await prisma.product.create({
    data: {
      title: 'Budget Car 5000',
      description: 'An affordable and reliable vehicle priced at $5,000.',
      imageURLs: [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop',
      ],
      category: category.category,
      categoryId: category.id,
      price: 5000,
      finalPrice: 5000,
      discount: 0,
      featured: false,
    },
  });

  console.log(JSON.stringify({ createdProductId: product.id, title: product.title, price: product.price }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


