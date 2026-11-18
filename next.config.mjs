/** @type {import('next').NextConfig} */
const nextConfig = {
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
