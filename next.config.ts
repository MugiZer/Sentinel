import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /** When other lockfiles exist above this repo, Turbopack can pick the wrong root and break `/api/*`. */
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
