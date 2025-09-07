/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const cspDev = [
      "default-src 'self'",
      "script-src 'self' https://js.stripe.com 'unsafe-eval' 'unsafe-inline'",
      "connect-src 'self' https://api.stripe.com https://r.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "img-src 'self' data: https://*.stripe.com https://images.unsplash.com",
      "style-src 'self' 'unsafe-inline'",
    ].join('; ');

    const cspProd = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com",
      // No inline/eval in production
      "script-src 'self' https://js.stripe.com",
      "connect-src 'self' https://api.stripe.com https://r.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "img-src 'self' data: https://*.stripe.com https://images.unsplash.com",
      "style-src 'self' 'unsafe-inline'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: isProd ? cspProd : cspDev,
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
