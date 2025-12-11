import express, { Request, Response, NextFunction } from "express";
import { RequestLogger } from "../common/util/RequestLogger.ts";
import { ResponseLogger } from "../common/util/ResponseLogger.ts";
import cors from "cors";
import { createApp } from "./app.ts";

const mainApp = express();

mainApp.get("/healthcheck", (_, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * 1️⃣ CORS chính thức bằng thư viện
 */
mainApp.use(cors({
  origin: ["http://localhost:3000",],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-login-session"],
}));

/**
 * 2️⃣ CORS thủ công tự thêm header
 */
mainApp.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*"); // ⚠️ mâu thuẫn với origin ở trên
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-login-session");

  // Xử lý preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

mainApp.use(RequestLogger,ResponseLogger);
const app = createApp();
mainApp.use(app);


const PORT = 3001;
mainApp.listen(PORT, () => {
  console.log(`🚀 Main app listening at http://localhost:${PORT}`);
});
