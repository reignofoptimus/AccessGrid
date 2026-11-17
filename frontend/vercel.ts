// Evaluated by Vercel during deployment; no browser-side secrets or UI changes.
const origin = (process.env.BACKEND_ORIGIN || '').trim().replace(/\/+$/, '');
if (!origin) {
  throw new Error('Add BACKEND_ORIGIN in Vercel: the HTTPS URL of your Render backend, without /api.');
}
const parsed = new URL(origin);
if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
  throw new Error('BACKEND_ORIGIN must be an HTTPS origin only, without a path, credentials, query or fragment.');
}

export const config = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [{ source: '/api/:path*', destination: `${origin}/api/:path*` }],
};
