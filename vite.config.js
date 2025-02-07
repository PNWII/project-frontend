import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: process.env.PORT || 8080, // ใช้ตัวแปรสภาพแวดล้อม PORT หรือ 8080
  },
});
