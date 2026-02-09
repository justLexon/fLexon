import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.."
  ),
};

export default nextConfig;
