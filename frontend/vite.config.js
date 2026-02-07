import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // FIX: This ensures all assets (JS, CSS) are loaded using relative paths 
  // (e.g., './assets/...' instead of '/assets/...') so the app works 
  // on deployment platforms like Render that use URL rewrites.
  base: '/',
})
