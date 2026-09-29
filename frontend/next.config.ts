import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/dashboard/pools/:poolId/treasury",
        destination: "/dashboard/pools/:poolId/withdrawals",
      },
      {
        source: "/dashboard/pools/:poolId/balance",
        destination: "/dashboard/pools/:poolId/withdrawals",
      },
      {
        source: "/pools/:poolId/treasury",
        destination: "/dashboard/pools/:poolId/withdrawals",
      },
      {
        source: "/pools/:poolId/balance",
        destination: "/dashboard/pools/:poolId/withdrawals",
      },
      {
        source: "/pools/:poolId/withdrawals",
        destination: "/dashboard/pools/:poolId/withdrawals",
      },
    ];
  },
};

export default nextConfig;
