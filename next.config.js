/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.paypalobjects.com" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const cspDev = [
      "default-src 'self'",
      "script-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com 'unsafe-eval' 'unsafe-inline'",
      "connect-src 'self' https://api.stripe.com https://r.stripe.com https://www.paypal.com https://api-m.sandbox.paypal.com https://api-m.paypal.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
      "img-src 'self' data: https://*.stripe.com https://images.unsplash.com https://www.paypalobjects.com https://*.paypal.com",
      "style-src 'self' 'unsafe-inline'",
    ].join('; ');

    const cspProd = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
      "script-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
      "connect-src 'self' https://api.stripe.com https://r.stripe.com https://www.paypal.com https://api-m.sandbox.paypal.com https://api-m.paypal.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
      "img-src 'self' data: https://*.stripe.com https://images.unsplash.com https://www.paypalobjects.com https://*.paypal.com",
      "style-src 'self' 'unsafe-inline'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: isProd ? cspProd : cspDev },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
