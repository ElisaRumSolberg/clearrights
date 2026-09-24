import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (Cloud Run).
  output: "standalone",
  turbopack: {
    // A stray package-lock.json in the home folder confuses root detection.
    root: path.join(__dirname),
  },
};

export default nextConfig;
