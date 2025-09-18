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
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to fix MongoDB syntax errors
function fixMongoDBSyntax(content) {
  let updated = content;
  
  // Fix common syntax errors from the previous replacement
  const fixes = [
    // Fix findMany syntax
    {
      from: /findMany\(\s*{\s*{\s*([^}]+)\s*}\s*}\s*\)/g,
      to: "findMany('$1', { $1: true })"
    },
    {
      from: /findMany\(\s*{\s*{\s*([^}]+)\s*}\s*}\s*\)/g,
      to: "findMany('users', { $1 })"
    },
    
    // Fix update syntax
    {
      from: /update\(\s*{\s*{\s*([^}]+)\s*},\s*data:\s*([^}]+)\s*}\s*\)/g,
      to: "updateOne('$1', { $1 }, $2)"
    },
    
    // Fix ObjectId syntax
    {
      from: /{\s*_id:\s*new\s+ObjectId\(([^)]+)\)\s*}/g,
      to: "{ _id: new ObjectId($1) }"
    },
    
    // Fix insertOne syntax
    {
      from: /insertOne\('([^']+)',\s*([^)]+)\)/g,
      to: "insertOne('$1', $2)"
    }
  ];
  
  // More specific fixes for common patterns
  const specificFixes = [
    // Fix findMany with role filter
    {
      from: /findMany\(\s*{\s*{\s*role:\s*'ADMIN'\s*}\s*}\s*\)/g,
      to: "findMany('users', { role: 'ADMIN' })"
    },
    
    // Fix updateOne calls
    {
      from: /updateOne\(\s*{\s*_id:\s*new\s+ObjectId\(([^)]+)\)\s*},\s*([^}]+)\s*\)/g,
      to: "updateOne('$1', { _id: new ObjectId($1) }, $2)"
    },
    
    // Fix create calls
    {
      from: /create\(\s*{\s*data:\s*([^}]+)\s*}\s*\)/g,
      to: "insertOne('$1', $1)"
    }
  ];
  
  [...fixes, ...specificFixes].forEach(({ from, to }) => {
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
      const updated = fixMongoDBSyntax(content);
      
      if (updated !== content) {
        fs.writeFileSync(file, updated, 'utf8');
        console.log(`✅ Fixed: ${file}`);
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });
  
  console.log(`\n🎉 Fixed ${processedCount} files successfully!`);
}

main();
