const express = require("express");
const app = express();

// ตั้งค่าให้ฟังพอร์ตที่ได้จาก environment variable
const port = process.env.PORT || 4173;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
