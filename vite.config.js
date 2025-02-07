import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // ทำให้แอปสามารถเข้าถึงได้จากภายนอก
    port: 8080,         // กำหนดพอร์ตที่แอปจะรัน
  },
});
