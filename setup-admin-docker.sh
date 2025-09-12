#!/bin/bash

# MJ Carros Docker Admin Setup Script
# This script sets up admin user when running in Docker

echo "🐳 MJ Carros Docker Admin Setup"
echo "================================"
echo ""

# Check if we're in Docker
if [ -f /.dockerenv ]; then
    echo "✅ Running inside Docker container"
else
    echo "⚠️  This script is designed to run inside Docker containers"
    echo "💡 For local development, use: ./setup-admin.sh"
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please ensure environment variables are set."
    echo "📝 Required variables:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - ADMIN_EMAIL (optional)"
    echo "   - ADMIN_PASSWORD (optional)"
    echo "   - ADMIN_NAME (optional)"
    exit 1
fi

# Run the admin setup script
echo "🔐 Creating admin user and initial data..."
node scripts/setup-admin.js

echo ""
echo "🎉 Docker setup completed!"
echo ""
echo "📋 Admin credentials:"
echo "   Check the output above for login details"
echo ""
echo "🌐 Access URLs:"
echo "   Admin Panel: http://localhost:8080/admin (or your mapped port)"
echo "   Sign In: http://localhost:8080/sign-in"
