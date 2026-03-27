import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@lms/validation'],
};

export default nextConfig;
