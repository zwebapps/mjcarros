#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Edge Runtime compatibility issues...');

// Find all API route files that use JWT auth
const apiFiles = [
  'app/api/auth/signin/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/clerk/users/route.ts',
  'app/api/clerk/users/[id]/route.ts',
  'app/api/billboards/edit/[id]/route.ts',
  'app/api/product/edit/[id]/route.ts',
  'app/api/contact/cms/route.ts',
  'app/api/categories/edit/[id]/route.ts',
  'app/api/orders/route.ts',
  'app/api/products/bulk-upload/route.ts'
];

let fixedCount = 0;

apiFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file uses JWT auth and doesn't already have runtime export
    if (content.includes('@/lib/auth') && !content.includes("export const runtime = 'nodejs'")) {
      // Find the imports section and add runtime export after it
      const lines = content.split('\n');
      let insertIndex = -1;
      
      // Find the last import line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('process.env')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' && insertIndex > -1) {
          break;
        }
      }
      
      if (insertIndex > -1) {
        lines.splice(insertIndex, 0, '', "export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility");
        content = lines.join('\n');
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed: ${filePath}`);
        fixedCount++;
      }
    } else if (content.includes("export const runtime = 'nodejs'")) {
      console.log(`⏭️  Already fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No JWT auth: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('');
console.log(`✅ Fixed ${fixedCount} API routes for Edge Runtime compatibility`);
console.log('');
console.log('🎯 What this fixes:');
console.log('  - jsonwebtoken Edge Runtime errors');
console.log('  - bcryptjs compatibility issues');
console.log('  - Node.js API usage in API routes');
console.log('');
console.log('🚀 Your build should now succeed!');
