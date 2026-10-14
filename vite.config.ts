import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Listen on the LAN too (not just localhost) so the app can be opened from
  // a phone/tablet on the same Wi-Fi during testing — Vite prints the IP to
  // use under "Network:" when the dev server starts.
  server: {
    host: true,
  },
})
