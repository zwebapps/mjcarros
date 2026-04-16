import { uploadOrderVoucherToS3 } from '../lib/voucher-storage';

const mockOrder = {
  _id: 'test-order',
  id: 'test-order',
  orderNumber: 1,
  isPaid: true,
  userEmail: 'test@example.com',
  phone: '',
  address: '',
  paymentMethod: 'card',
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [
    {
      productId: 'p1',
      productName: 'Sample Car',
      quantity: 1,
      price: 10000,
      product: {
        _id: 'p1',
        title: 'Sample Car',
        description: '',
        price: 10000,
        category: 'sedan',
        modelName: 'X',
        year: 2024,
        mileage: 1000,
        fuelType: 'petrol',
        color: 'black',
        condition: 'new',
        imageURLs: ['/logo.png'],
      },
    },
  ],
};

async function main() {
  const url = await uploadOrderVoucherToS3(mockOrder as any);
  if (url) console.log('✅ Voucher saved:', url);
  else console.log('⚠️ Voucher generation returned null');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
