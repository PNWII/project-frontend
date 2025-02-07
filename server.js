// โหลด dotenv เพื่อดึงข้อมูลจากไฟล์ .env
require("dotenv").config();

// ใช้ตัวแปรจากไฟล์ .env
const cleverToken = process.env.CLEVER_TOKEN;
const cleverSecret = process.env.CLEVER_SECRET;

// แสดงผลตัวแปรใน Console
console.log(cleverToken);
console.log(cleverSecret);

// การใช้งานตัวแปรในโค้ด (ตัวอย่าง)
if (cleverToken && cleverSecret) {
  console.log("CLEVER credentials are loaded.");
}
