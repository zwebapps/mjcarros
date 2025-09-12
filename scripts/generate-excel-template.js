const XLSX = require('xlsx');
const path = require('path');

// Create template data with realistic car examples
const templateData = [
  {
    name: 'BMW X5 xDrive40i 2023',
    price: 75000,
    category: 'SUV',
    make: 'BMW',
    year: 2023,
    colour: 'Black Sapphire',
    model: 'X5',
    mileage: 15000,
    fuelType: 'Petrol',
    vin: 'WBAFR7C50LC123456',
    deliveryDate: '2024-01-15',
    description: 'Luxury SUV with premium features, panoramic sunroof, and advanced driver assistance systems',
    isFeatured: 'true',
    isArchived: 'false',
    images: 'https://example.com/bmw-x5-1.jpg,https://example.com/bmw-x5-2.jpg,https://example.com/bmw-x5-3.jpg'
  },
  {
    name: 'Mercedes-Benz C-Class C300 2022',
    price: 55000,
    category: 'Sedan',
    make: 'Mercedes-Benz',
    year: 2022,
    colour: 'Polar White',
    model: 'C-Class',
    mileage: 25000,
    fuelType: 'Petrol',
    vin: 'WDD2050461A123456',
    deliveryDate: '2024-02-01',
    description: 'Elegant sedan with MBUX infotainment system and premium interior',
    isFeatured: 'false',
    isArchived: 'false',
    images: 'https://example.com/mercedes-c300-1.jpg,https://example.com/mercedes-c300-2.jpg'
  },
  {
    name: 'Audi A4 Quattro 2023',
    price: 48000,
    category: 'Sedan',
    make: 'Audi',
    year: 2023,
    colour: 'Mythos Black',
    model: 'A4',
    mileage: 12000,
    fuelType: 'Petrol',
    vin: 'WAUZZZ8V0MA123456',
    deliveryDate: '2024-01-20',
    description: 'Sporty sedan with quattro all-wheel drive and virtual cockpit',
    isFeatured: 'true',
    isArchived: 'false',
    images: 'https://example.com/audi-a4-1.jpg,https://example.com/audi-a4-2.jpg,https://example.com/audi-a4-3.jpg,https://example.com/audi-a4-4.jpg'
  },
  {
    name: 'Tesla Model 3 Long Range 2023',
    price: 65000,
    category: 'Electric',
    make: 'Tesla',
    year: 2023,
    colour: 'Pearl White',
    model: 'Model 3',
    mileage: 8000,
    fuelType: 'Electric',
    vin: '5YJ3E1EA0PF123456',
    deliveryDate: '2024-01-10',
    description: 'Electric sedan with autopilot, 358-mile range, and over-the-air updates',
    isFeatured: 'true',
    isArchived: 'false',
    images: 'https://example.com/tesla-model3-1.jpg,https://example.com/tesla-model3-2.jpg'
  },
  {
    name: 'Porsche 911 Carrera 2022',
    price: 125000,
    category: 'Sports',
    make: 'Porsche',
    year: 2022,
    colour: 'Guards Red',
    model: '911',
    mileage: 5000,
    fuelType: 'Petrol',
    vin: 'WP0AB2A99NS123456',
    deliveryDate: '2024-02-15',
    description: 'Iconic sports car with 385hp twin-turbo engine and precision handling',
    isFeatured: 'true',
    isArchived: 'false',
    images: 'https://example.com/porsche-911-1.jpg,https://example.com/porsche-911-2.jpg,https://example.com/porsche-911-3.jpg'
  },
  {
    name: 'Range Rover Evoque 2023',
    price: 68000,
    category: 'SUV',
    make: 'Land Rover',
    year: 2023,
    colour: 'Fuji White',
    model: 'Evoque',
    mileage: 18000,
    fuelType: 'Petrol',
    vin: 'SALVA2BG0NH123456',
    deliveryDate: '2024-01-25',
    description: 'Compact luxury SUV with Terrain Response and premium interior',
    isFeatured: 'false',
    isArchived: 'false',
    images: 'https://example.com/range-rover-evoque-1.jpg,https://example.com/range-rover-evoque-2.jpg'
  }
];

// Create instructions data
const instructions = [
  ['CAR UPLOAD TEMPLATE - INSTRUCTIONS'],
  [''],
  ['REQUIRED FIELDS (must be filled):'],
  ['• name - Product name (e.g., "BMW X5 xDrive40i 2023")'],
  ['• price - Product price as number (e.g., 75000)'],
  ['• category - Category name (must match existing: SUV, Sedan, Sports, Electric)'],
  ['• make - Car manufacturer (e.g., BMW, Mercedes-Benz, Audi)'],
  ['• year - Manufacturing year as number (e.g., 2023)'],
  ['• colour - Car color (e.g., Black Sapphire, Polar White)'],
  ['• model - Car model (e.g., X5, C-Class, A4)'],
  ['• mileage - Car mileage as number (e.g., 15000)'],
  ['• fuelType - Fuel type (Petrol, Diesel, Electric, Hybrid)'],
  [''],
  ['OPTIONAL FIELDS:'],
  ['• vin - Vehicle Identification Number (17 characters)'],
  ['• deliveryDate - Delivery date in YYYY-MM-DD format'],
  ['• description - Product description'],
  ['• isFeatured - Set to "true" or "false" (without quotes)'],
  ['• isArchived - Set to "true" or "false" (without quotes)'],
  ['• images - Comma-separated image URLs'],
  [''],
  ['IMPORTANT NOTES:'],
  ['• Delete the example rows and add your own car data'],
  ['• Make sure category names match exactly (case-sensitive)'],
  ['• Price, year, and mileage must be numbers (no currency symbols)'],
  ['• Use "true" or "false" for boolean fields (no quotes)'],
  ['• Image URLs should be valid and accessible'],
  ['• VIN should be 17 characters long'],
  [''],
  ['SUPPORTED CATEGORIES:'],
  ['• SUV - Sports Utility Vehicles'],
  ['• Sedan - Four-door passenger cars'],
  ['• Sports - High-performance sports cars'],
  ['• Electric - Electric vehicles'],
  [''],
  ['TIPS:'],
  ['• Save as .xlsx format before uploading'],
  ['• Test with a few cars first before bulk upload'],
  ['• Check that all image URLs are working'],
  ['• Verify category names match your system categories']
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Add instructions sheet
const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

// Add template data sheet
const templateSheet = XLSX.utils.json_to_sheet(templateData);

// Set column widths for better readability
const columnWidths = [
  { wch: 30 }, // name
  { wch: 12 }, // price
  { wch: 12 }, // category
  { wch: 15 }, // make
  { wch: 8 },  // year
  { wch: 15 }, // colour
  { wch: 12 }, // model
  { wch: 10 }, // mileage
  { wch: 12 }, // fuelType
  { wch: 20 }, // vin
  { wch: 12 }, // deliveryDate
  { wch: 50 }, // description
  { wch: 12 }, // isFeatured
  { wch: 12 }, // isArchived
  { wch: 60 }  // images
];
templateSheet['!cols'] = columnWidths;

XLSX.utils.book_append_sheet(workbook, templateSheet, 'Car Data');

// Write to public folder
const outputPath = path.join(__dirname, '..', 'public', 'car-upload-template.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Excel template generated successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('📊 Template includes:');
console.log('   - Instructions sheet with detailed guidelines');
console.log('   - Sample car data (6 examples)');
console.log('   - Proper column formatting');
console.log('   - All required and optional fields');
console.log('');
console.log('🚀 Users can now download this template from:');
console.log('   http://localhost:3000/car-upload-template.xlsx');
