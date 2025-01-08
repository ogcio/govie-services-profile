import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  // Added this because `unleash-client` is a peer dependency
  // of `building-blocks-sdk` and when next.js builds the project,
  // if the dependency is not installed, throws an error,
  // even if the unleash-client is not really used
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('unleash-client');
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
