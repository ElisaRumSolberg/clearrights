import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // A stray package-lock.json in the home folder confuses root detection.
    root: path.join(__dirname),
  },
};

export default nextConfig;
