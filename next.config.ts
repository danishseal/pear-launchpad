import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Anchor and the wallet adapters ship CommonJS.
   *
   * Without this every route 500s with `ReferenceError: exports is not
   * defined`, thrown while the server renders a client component: the module
   * graph is evaluated on the server even for `"use client"` files, and an
   * un-transpiled CJS bundle has no `exports` object there. Listing them here
   * makes Next compile them like first-party source, which gives them the
   * interop they need on both sides.
   *
   * The alternative is loading every one of them behind a dynamic import with
   * `ssr:false`, which pushes the problem into a dozen call sites and makes
   * the chain layer awkward to use for the sake of a build setting.
   */
  transpilePackages: ["@coral-xyz/anchor", "@jup-ag/wallet-adapter"],
};

export default nextConfig;
