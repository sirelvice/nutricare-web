import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

// Explicitly include CA files instead of tracing an arbitrary runtime path.
// A custom PGSSLROOTCERT must also be available when building the deployment.
const databaseCertificates = Array.from(new Set([
  "./certs/prod-ca-2021.crt",
  ...(process.env.PGSSLROOTCERT ? [process.env.PGSSLROOTCERT] : []),
]));

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  outputFileTracingIncludes: {
    "/*": databaseCertificates,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});
export default withMDX(nextConfig);