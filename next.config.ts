import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The share picture reads its backgrounds and its font from assets/ at request time.
  outputFileTracingIncludes: {
    "/v/**": ["./assets/og/*.png", "./assets/fonts/*.ttf"],
  },
};

export default nextConfig;
