/** @type {import('next').NextConfig} */
const nextConfig = {
    // Emit a self-contained server bundle (.next/standalone) so the Docker
    // runtime image ships only the traced deps instead of the full node_modules.
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                pathname: '/**',
            }
        ],
    },
    // NOTE: the dashboard calls the backend directly using NEXT_PUBLIC_API_BASE_URL
    // (see utils/* and the fetch calls). The rewrite below is optional and only
    // kicks in if you proxy /api through Next; it is driven by an env var so there
    // are no hardcoded tunnel URLs. Set API_PROXY_DESTINATION to enable it.
    async rewrites() {
        const dest = process.env.API_PROXY_DESTINATION;
        if (!dest) return [];
        return [
          {
            source: '/api/:path*',
            destination: `${dest}/api/:path*`,
          },
        ];
      },
};

export default nextConfig;