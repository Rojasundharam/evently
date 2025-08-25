import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize performance
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@supabase/supabase-js', 
      'crypto-js', 
      'qrcode',
      'html2canvas',
      'jspdf',
      'html5-qrcode',
      'date-fns'
    ],
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Remove duplicate turbopack config since it's in experimental now
  
  // Enable webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
      
      // Faster builds in development
      config.optimization.removeAvailableModules = false
      config.optimization.removeEmptyChunks = false
      config.optimization.splitChunks = false
      
      // Reduce bundle size in development
      config.resolve.alias = {
        ...config.resolve.alias,
        'crypto-js$': 'crypto-js/crypto-js.js',
        'html2canvas$': 'html2canvas/dist/html2canvas.min.js',
        'jspdf$': 'jspdf/dist/jspdf.umd.min.js',
      }
    }
    
    if (!dev && !isServer) {
      // Split chunks for better caching in production
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    
    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'crypto-js$': 'crypto-js/crypto-js.js',
    }
    
    return config
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // Faster development server
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
