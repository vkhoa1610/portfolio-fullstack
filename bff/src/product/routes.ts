import express from "express";
import { bffProduct001 } from "@product/product-001/index.js";
import { bffProduct002 } from "@product/product-002/index.js";
import { bffProduct003 } from "@product/product-003/index.js";
import { bffProduct004 } from "@product/product-004/index.js";
import { bffProduct005 } from "@product/product-005/index.js";
import { bffProduct006 } from "@product/product-006/index.js";
import { bffProduct007 } from "@product/product-007/index.js";
import { bffProduct008 } from "@product/product-008/index.js";
import { bffProduct009 } from "@product/product-009/index.js";
import { bffProduct010 } from "@product/product-010/index.js";
import { bffProduct011 } from "@product/product-011/index.js";
import { bffProduct012 } from "@product/product-012/index.js";
import { bffProduct013 } from "@product/product-013/index.js";
import { bffProduct014 } from "@product/product-014/index.js";
import { bffProduct015 } from "@product/product-015/index.js";
import { bffProduct016 } from "@product/product-016/index.js";
import { bffProduct017 } from "@product/product-017/index.js";

const bffSetting = [
  bffProduct001,
  bffProduct002,
  bffProduct003,
  bffProduct004,
  bffProduct005, // POST /auth/mfa
  bffProduct006, // GET /auth/session
  bffProduct007, // POST /auth/logout
  bffProduct008, // POST /onboarding/consent
  bffProduct009, // POST /onboarding/profile
  bffProduct014, // POST /expenses/scan   ← scan trước để không bị override bởi :id
  bffProduct010, // POST /expenses
  bffProduct011, // GET  /expenses
  bffProduct012, // GET  /expenses/:id
  bffProduct013, // POST /expenses/:id/submit
  bffProduct015, // GET  /manager/expenses
  bffProduct016, // PUT  /manager/expenses/:id/approve
  bffProduct017, // PUT  /manager/expenses/:id/reject
];

export const createRouter = () => {
  const router = express.Router();

  bffSetting.forEach((bff) => {
    const method = bff.method.toLowerCase();
    if (typeof (router as any)[method] === "function") {
      (router as any)[method](bff.endpoint, bff.handle);
      console.log(`✅ Mounted [${bff.method.toUpperCase()}] ${bff.endpoint}`);
    } else {
      console.warn(`⚠️ Invalid method: ${bff.method}`);
    }
  });

  return router;
};
