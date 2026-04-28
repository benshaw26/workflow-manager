/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', '@anthropic-ai/sdk'],
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
    instrumentationHook: true,
  },
}

export default nextConfig
