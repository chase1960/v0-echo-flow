import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack guesses the workspace root by looking for lockfiles upward. When
  // the repo sits inside another project that also has one, the guess lands on
  // the parent and the build reads the wrong tree. Pin the root to this folder.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  // `ignoreBuildErrors: true` used to sit here. That is why the API could drift
  // away from the data model without anyone noticing: the build stayed green
  // while the client read fields that no longer existed. Type errors now fail
  // the build, on purpose.
  images: {
    // YouTube thumbnails come from img.youtube.com. Optimising them needs a
    // remote pattern plus image quota; they are already small and cached at
    // the edge, so pass them through untouched.
    unoptimized: true,
  },
}

export default nextConfig
