/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.brood-shop.nl',
            },
        ],
    },
}

module.exports = nextConfig
