import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  resolve : {
    tsconfigPaths: true
  },
  plugins: [
    react(),
    tailwindcss(),
  ]

  }
)
