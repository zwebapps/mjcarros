import { backupOrderToS3, listOrderBackups, logOrderCreation } from '../lib/order-backup';

async function main() {
  const mock = {
    _id: 'test-backup-id',
    id: 'test-backup-id',
    orderNumber: 999001,
    isPaid: true,
    userEmail: 'backup-test@example.com',
    phone: '+1000000000',
    address: 'Test',
    paymentMethod: 'card',
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [
      {
        id: 'line-1',
        productId: 'prod-1',
        productName: 'Test Vehicle',
        quantity: 1,
        price: 5000,
        product: {
          id: 'prod-1',
          title: 'Test Vehicle',
          price: 5000,
          modelName: 'X',
          year: 2024,
          color: 'black',
          mileage: 1000,
          fuelType: 'petrol',
          imageURLs: ['/logo.png'],
        },
      },
    ],
  };

  logOrderCreation(mock);
  await backupOrderToS3(mock);
  const list = await listOrderBackups();
  console.log('Backup keys (sample):', list.slice(0, 5));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
