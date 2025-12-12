import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// Vite configuration for DevSync Frontend
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
