import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://127.0.0.1:8000",
  },
};

export default nextConfig;
