import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { loadEnv } from 'vite';
import process from 'process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL ? env.VITE_API_URL.replace('/api', '') : "http://127.0.0.1:8080",
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});