let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ULTRA MEMORY OPTIMIZATION
  swcMinify: true, // Use faster SWC minifier
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },
  experimental: {
    // Turbopack for faster dev with less memory
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Memory optimizations
  webpack: (config, { dev, isServer }) => {
    // Aggressive memory optimization for dev
    if (dev) {
      config.cache = false // Disable cache in dev to save memory
      config.watchOptions = {
        poll: 3000, // Check for changes every 3 seconds instead of constantly
        aggregateTimeout: 300,
      }
    }
    
    // Reduce memory usage during builds
    config.optimization = {
      ...config.optimization,
      runtimeChunk: isServer ? false : 'single',
      minimize: !dev, // Only minimize in production
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Commons chunk
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    }
    
    // Reduce bundle size - tree shake unused code
    config.optimization.usedExports = true
    
    return config
  },
  // Reduce bundle size
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Disable features we don't use
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: false,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
