import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Generates static HTML/JS/CSS files in the out/ directory
  images: { 
    unoptimized: true // Disables Next.js server-side image optimization for static builds
  },
};

export default nextConfig;