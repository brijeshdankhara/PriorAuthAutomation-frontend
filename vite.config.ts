import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Deployed at the root of its own subdomain (autopa.brijeshdankhara.com),
  // not a subpath -- Squarespace can't proxy a single path on the main
  // domain to another host, only redirect to a different (sub)domain.
  // amazon-cognito-identity-js assumes Node's `global` exists (it doesn't
  // in a browser) -- the standard fix is aliasing it to globalThis.
  define: {
    global: 'globalThis',
  },
})
