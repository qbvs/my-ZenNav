import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for client-side code
      // This picks up variables from .env file (local) or Cloudflare/Vercel Environment Variables (production)
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.ADMIN_PASSWORD': JSON.stringify(env.ADMIN_PASSWORD)
    }
  };
});