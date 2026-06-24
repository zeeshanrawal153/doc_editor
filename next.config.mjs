/** @type {import('next').NextConfig} */
const nextConfig = {
  // @libsql/client ships native/optional deps; mark it external so the
  // Next.js bundler doesn't try to bundle it for serverless functions.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
