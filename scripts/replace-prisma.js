const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to replace Prisma calls with MongoDB calls
function replacePrismaWithMongoDB(content) {
  let updated = content;
  
  // Replace common Prisma patterns
  const replacements = [
    // Import statements
    {
      from: /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"];?\s*/g,
      to: "import { findOne, findMany, insertOne, updateOne, deleteOne, countDocuments } from '@/lib/mongodb';\nimport { ObjectId } from 'mongodb';\n"
    },
    {
      from: /const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\s*/g,
      to: ""
    },
    {
      from: /const\s+db\s*=\s*new\s+PrismaClient\(\);?\s*/g,
      to: ""
    },
    
    // Database operations
    {
      from: /db\.(\w+)\.findUnique\(\s*{\s*where:\s*{\s*(\w+):\s*([^}]+)\s*}\s*}\s*\)/g,
      to: "findOne('$1', { $2: $3 })"
    },
    {
      from: /db\.(\w+)\.findMany\(\s*{\s*include:\s*[^}]*\s*}\s*\)/g,
      to: "findMany('$1')"
    },
    {
      from: /db\.(\w+)\.findMany\(\s*{\s*where:\s*([^}]+)\s*}\s*\)/g,
      to: "findMany('$1', $2)"
    },
    {
      from: /db\.(\w+)\.findMany\(\)/g,
      to: "findMany('$1')"
    },
    {
      from: /db\.(\w+)\.create\(\s*{\s*data:\s*([^}]+)\s*}\s*\)/g,
      to: "insertOne('$1', $2)"
    },
    {
      from: /db\.(\w+)\.update\(\s*{\s*where:\s*([^,}]+),\s*data:\s*([^}]+)\s*}\s*\)/g,
      to: "updateOne('$1', $2, $3)"
    },
    {
      from: /db\.(\w+)\.delete\(\s*{\s*where:\s*([^}]+)\s*}\s*\)/g,
      to: "deleteOne('$1', $2)"
    },
    {
      from: /db\.(\w+)\.count\(\s*{\s*where:\s*([^}]+)\s*}\s*\)/g,
      to: "countDocuments('$1', $2)"
    },
    {
      from: /db\.(\w+)\.count\(\)/g,
      to: "countDocuments('$1')"
    },
    
    // ObjectId conversions
    {
      from: /where:\s*{\s*id:\s*([^}]+)\s*}/g,
      to: "{ _id: new ObjectId($1) }"
    },
    {
      from: /where:\s*{\s*(\w+):\s*([^}]+)\s*}/g,
      to: "{ $1: $2 }"
    }
  ];
  
  replacements.forEach(({ from, to }) => {
    updated = updated.replace(from, to);
  });
  
  return updated;
}

// Main function
function main() {
  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);
  
  console.log(`Found ${files.length} files to process...`);
  
  let processedCount = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Only process files that contain Prisma references
      if (content.includes('PrismaClient') || content.includes('db.') || content.includes('prisma.')) {
        const updated = replacePrismaWithMongoDB(content);
        
        if (updated !== content) {
          fs.writeFileSync(file, updated, 'utf8');
          console.log(`✅ Updated: ${file}`);
          processedCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });
  
  console.log(`\n🎉 Processed ${processedCount} files successfully!`);
}

main();
