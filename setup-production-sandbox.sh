#!/bin/bash

echo "🚀 Setting up MJ Carros Production Environment with Sandbox Payments"
echo "=================================================================="

# Create production environment file with sandbox payment testing
cat > .env.production << 'EOF'
# ========================================
# PRODUCTION DATABASE CONFIGURATION
# ========================================
DATABASE_URL="mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=admin"

# ========================================
# JWT AUTHENTICATION
# ========================================
JWT_SECRET="your-production-jwt-secret-change-this"

# ========================================
# APP CONFIGURATION
# ========================================
NEXT_PUBLIC_APP_URL="https://mjcarros.pt"
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
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="waseembt10029@hotmail.com"
EMAIL_PASS="your_email_password"
EMAIL_FROM="MJ Carros <no-reply@mjcarros.pt>"
SUPPORT_EMAIL="waseembt10029@hotmail.com"

# ========================================
# AWS S3 CONFIGURATION (Optional)
# ========================================
# AWS_ACCESS_KEY_ID="your_aws_access_key"
# AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
# AWS_REGION="eu-north-1"
# AWS_BUCKET_NAME="mjcarros-images"
# NEXT_PUBLIC_S3_BASE_URL="https://mjcarros-images.s3.eu-north-1.amazonaws.com"
EOF

echo "✅ Production environment file created: .env.production"
echo ""
echo "📋 Next Steps for mjcarros.pt:"
echo "1. Update the Stripe test keys with your actual test keys from Stripe Dashboard"
echo "2. Update the PayPal sandbox keys with your actual sandbox app credentials"
echo "3. Set up webhooks in Stripe Dashboard pointing to: https://mjcarros.pt/api/webhook"
echo "4. Set up webhooks in PayPal Developer pointing to: https://mjcarros.pt/api/paypal/webhook"
echo "5. Deploy your application to mjcarros.pt with this environment file"
echo ""
echo "🧪 Testing Instructions:"
echo "- Use Stripe test cards: 4242 4242 4242 4242 (success)"
echo "- Use PayPal sandbox buyer accounts for testing"
echo "- All payments will be test transactions (no real money)"
echo ""
echo "⚠️  Remember: This is for TESTING on production domain"
echo "   When ready for real payments, replace with live keys!"
