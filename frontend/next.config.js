/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['localhost', 'api.xploitrum.org'],
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_CTF_URL: process.env.NEXT_PUBLIC_CTF_URL || 'http://localhost:3001',
        NEXT_PUBLIC_LAB_URL: process.env.NEXT_PUBLIC_LAB_URL || 'http://localhost:3002',
        NEXT_PUBLIC_SHOPIFY_STORE_URL: process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '',
        NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
        NEXT_PUBLIC_SHOPIFY_COLLECTION_URL: process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_URL || '',
        NEXT_PUBLIC_SHOPIFY_COLLECTION_ID: process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_ID || '',
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
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
