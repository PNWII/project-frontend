import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // ทำให้เซิร์ฟเวอร์สามารถเข้าถึงจากภายนอกได้
    port: 4173, // ใช้พอร์ต 8080 โดยตรง
    open: true, // เปิดหน้าเว็บในเบราว์เซอร์อัตโนมัติ
  },
});
