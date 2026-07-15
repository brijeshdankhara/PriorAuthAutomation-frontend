import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // The public deployment lives at www.brijeshdankhara.com/auto-pa-test --
  // local dev still serves from the root.
  base: command === 'build' ? '/auto-pa-test/' : '/',
  // amazon-cognito-identity-js assumes Node's `global` exists (it doesn't
  // in a browser) -- the standard fix is aliasing it to globalThis.
  define: {
    global: 'globalThis',
  },
}))
