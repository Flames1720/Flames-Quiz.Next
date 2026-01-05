/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile problematic ESM packages that ship non-transpiled code
  transpilePackages: ["undici", "firebase"],
  // Allow loose handling of ESM externals to improve compatibility with
  // packages like `undici` and Firebase that ship modern ESM syntax.
  experimental: {
    esmExternals: 'loose'
  },
  images: {
    domains: ['placehold.co'], 
  },
};

const path = require('path');

// Prevent bundling the Node-only `undici` package into client bundles
// by aliasing it to an empty stub during build. This avoids SWC parse
// errors from undici's modern ESM code while leaving browser fetch intact.
nextConfig.webpack = (config) => {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    undici: path.resolve(__dirname, 'src/lib/empty-undici.js'),
  };
  config.resolve.fallback = { ...(config.resolve.fallback || {}), undici: false };
  return config;
};

module.exports = nextConfig;