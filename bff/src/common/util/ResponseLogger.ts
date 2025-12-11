import { Request, Response, NextFunction } from "express";

export function ResponseLogger(req: Request, res: Response, next: NextFunction) {
  // 1️⃣ Giữ bản gốc của res.send
  const originalSend = res.send;

  // 2️⃣ Ghi đè res.send
  res.send = function (body?: any): Response {
    // Kiểm tra status code
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`[✅ SUCCESS] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    } else {
      console.error(`[❌ ERROR] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    }

    // 3️⃣ Gọi lại hàm gốc (đảm bảo context và body đúng)
    return originalSend.call(this, body);
  };

  // 4️⃣ Tiếp tục middleware kế
  next();
}
