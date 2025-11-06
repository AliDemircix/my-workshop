/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-quill'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
export default nextConfig;
