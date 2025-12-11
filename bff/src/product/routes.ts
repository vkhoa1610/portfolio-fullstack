import express from "express";
import { bffProduct001 } from "@product/product-001/index.js";
import { bffProduct002 } from "@product/product-002/index.js";
import { bffProduct003 } from "@product/product-003/index.js";

const bffSetting = [bffProduct001, bffProduct002, bffProduct003];

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
