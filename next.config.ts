import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dmpisdcudbswlsevnkmw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // 開発環境では無効化
  register: true,
  skipWaiting: true,
  swSrc: "public/service-worker.js",
  buildExcludes: [
    /middleware-manifest\.json$/,
    /middleware-build-manifest\.json$/,
  ],
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
});

export default pwaConfig(nextConfig);
