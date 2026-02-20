/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. External Packages (Vercel Build Fix)
    // Avoid bundling server-side only modules that use native file system.
    serverExternalPackages: ['sharp', 'fs', 'path'],

    // 2. Image Optimization (Remote Patterns)
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'drive.google.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },

    // 3. Server Actions Config
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // 4. Webpack Specific: FS Fallback
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                path: false,
                os: false,
            };
        }
        return config;
    },

    // 5. Silence Turbopack warning
    turbopack: {},
};

module.exports = nextConfig;
