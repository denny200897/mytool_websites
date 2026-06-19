import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy: no third-party origins at all — every asset
// (fonts, ffmpeg core, tesseract core + language data) is self-hosted.
// The only non-'self' tokens are the platform primitives WebAssembly and
// canvas require: 'wasm-unsafe-eval' (run wasm), 'unsafe-eval' (onnxruntime-web
// in the AI background-removal tool calls new Function() to bootstrap its wasm
// runtime), blob: (wasm/worker URLs), data: (canvas image exports).
// 'unsafe-inline' style covers inline <style> in the Markdown→PDF print window
// and React style attributes.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function securityHeaders(withCsp: boolean) {
  return (_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    for (const [k, v] of Object.entries(BASE_SECURITY_HEADERS)) res.setHeader(k, v)
    // CSP is only applied to the production preview; the dev server needs
    // inline scripts + ws: for HMR, which a strict CSP would break.
    if (withCsp) res.setHeader('Content-Security-Policy', CSP)
    next()
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use(securityHeaders(false))
      },
      configurePreviewServer(server) {
        server.middlewares.use(securityHeaders(true))
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
