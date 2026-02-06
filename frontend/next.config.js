/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['localhost', 'api.xploitrum.org', 'shop.xploitrum.org'],
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xploitrum.org',
        NEXT_PUBLIC_SHOPIFY_STORE_URL: process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '',
        NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
        NEXT_PUBLIC_SHOPIFY_COLLECTION_URL: process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_URL || '',
        NEXT_PUBLIC_SHOPIFY_COLLECTION_ID: process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_ID || '',
    },
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        return [
            // /api/v1/... -> backend /api/v1/... (avoid doubling v1)
            {
                source: '/api/v1/:path*',
                destination: `${apiUrl}/api/v1/:path*`,
            },
            // /api/... (e.g. /api/pico/..., /api/events/...) -> backend /api/v1/...
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/v1/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
