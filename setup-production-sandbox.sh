#!/bin/bash

echo "🚀 Setting up MJ Carros Production Environment with Sandbox Payments"
echo "=================================================================="

cat > .env.production << 'EOF'
# ========================================
# PRODUCTION DATABASE CONFIGURATION
# ========================================
# Set your real connection string in deployment secrets — never commit real passwords.
DATABASE_URL="mongodb://USER:PASSWORD@mongodb:27017/mjcarros?authSource=admin"

# ========================================
# JWT AUTHENTICATION
# ========================================
JWT_SECRET="replace-with-long-random-secret"

# ========================================
# APP CONFIGURATION
# ========================================
NEXT_PUBLIC_APP_URL="https://your-domain.example"
NODE_ENV="production"

# ========================================
# STRIPE SANDBOX TESTING (Replace with your test keys)
# ========================================
STRIPE_SECRET_KEY="sk_test_your_stripe_test_secret_key"
STRIPE_API_KEY="sk_test_your_stripe_test_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_test_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_test_publishable_key"

# ========================================
# PAYPAL SANDBOX TESTING (Replace with your sandbox keys)
# ========================================
PAYPAL_CLIENT_ID="your_sandbox_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_sandbox_paypal_client_secret"
PAYPAL_MODE="sandbox"

# ========================================
# EMAIL CONFIGURATION (Optional)
# ========================================
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="your_smtp_user"
EMAIL_PASS="your_smtp_password"
EMAIL_FROM="Your Store <no-reply@your-domain.example>"
SUPPORT_EMAIL="support@your-domain.example"

# ========================================
# AWS S3 CONFIGURATION (Optional)
# ========================================
# AWS_ACCESS_KEY_ID="your_aws_access_key"
# AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
# AWS_REGION="eu-north-1"
# AWS_BUCKET_NAME="your-bucket"
# NEXT_PUBLIC_S3_BASE_URL="https://your-bucket.s3.region.amazonaws.com"
EOF

echo "✅ Production environment file created: .env.production"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.production and replace placeholders with real secrets (do not commit the file if it contains secrets)."
echo "2. Configure Stripe and PayPal webhooks for your domain."
echo "3. Deploy with secrets injected by your host (Kubernetes secrets, Docker secrets, etc.)."
echo ""
echo "⚠️  Remember: Use live payment keys only when you are ready for real transactions."
