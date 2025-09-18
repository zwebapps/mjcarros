#!/bin/bash

echo "🚀 Setting up MJ Carros E-commerce Project"
echo "=========================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
# Database Configuration
DATABASE_URL="mongodb://localhost:27017/mjcarros?replicaSet=rs0"

# JWT Authentication
JWT_SECRET="${JWT_SECRET}"

# AWS S3 Configuration (Optional - for image uploads)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_REGION="your-aws-region"
# AWS_BUCKET_NAME="your-s3-bucket-name"
# NEXT_PUBLIC_S3_BASE_URL="https://your-s3-bucket.s3.your-region.amazonaws.com"

# Stripe Configuration (Optional - for payments)
# STRIPE_SECRET_KEY="your-stripe-secret-key"
# STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update AWS S3 credentials if you plan to use S3 for image uploads"
echo "2. Update Stripe keys if you plan to use payments"
echo "3. Run: npm install"
echo "4. Start MongoDB container: docker compose -f docker-compose.prod.yml up mongodb -d"
echo "5. Run: npm run dev"
echo ""
echo "🔐 Your JWT secret has been generated and saved to .env.local"
echo "⚠️  Keep this file secure and never commit it to version control!"
echo ""
echo "🌐 For S3 configuration:"
echo "   - Set NEXT_PUBLIC_S3_BASE_URL to your bucket's public URL"
echo "   - Example: https://my-bucket.s3.us-east-1.amazonaws.com"
