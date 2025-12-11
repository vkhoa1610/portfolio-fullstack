import { Request, Response, NextFunction } from "express";

export function RequestLogger(req: Request, res: Response, next: NextFunction) {
  const now = new Date().toISOString();
  const loginSession = req.header("x-login-session");

  console.log(`[📥 REQUEST] ${req.method} ${req.originalUrl} - ${now}`);

  // 🔑 Log header x-login-session nếu có
  if (loginSession) {
    console.log(`  🔐 x-login-session: ${loginSession}`);
  } else {
    console.log(`  ⚠️  x-login-session: (none)`);
  }

  // Log query và body nếu có
  if (Object.keys(req.query).length > 0) {
    console.log("  🔹 Query:", req.query);
  }

  if (Object.keys(req.body || {}).length > 0) {
    console.log("  📦 Body:", req.body);
  }

  next();
}
