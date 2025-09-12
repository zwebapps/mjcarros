#!/bin/bash

# MJ Carros Admin Setup Script
# This script creates the first admin user and initial data

echo "🚀 MJ Carros Admin Setup"
echo "========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
        echo "📝 Please update .env with your actual values before running this script again."
        exit 1
    else
        echo "❌ No .env.example file found. Please create a .env file with your database connection."
        exit 1
    fi
fi

# Check if Prisma is set up
if [ ! -d "node_modules/.prisma" ]; then
    echo "📦 Installing dependencies and setting up Prisma..."
    npm install
    npx prisma generate
fi

# Run the admin setup script
echo "🔐 Creating admin user and initial data..."
node scripts/setup-admin.js

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Start your application: npm run dev"
echo "   2. Go to: http://localhost:3000/admin"
echo "   3. Login with the credentials shown above"
echo "   4. Change the default password"
echo "   5. Upload your first cars using the bulk upload feature"
echo ""
echo "💡 To create additional admin users, use the admin panel or run:"
echo "   node scripts/create-admin.js"
