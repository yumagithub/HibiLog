declare module "next-pwa" {
  import { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    swSrc?: string;
    [key: string]: any;
  }

  export default function withPWA(
    pwaConfig: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig;
}
