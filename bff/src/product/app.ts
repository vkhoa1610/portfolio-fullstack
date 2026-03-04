import express from "express";
import { createCommonRouter } from "@product/common/routes.js";
import { createEmployeeRouter } from "@product/employee/routes.js";
import { createManagerRouter } from "@product/manager/routes.js";
import { createFinanceRouter } from "@product/finance/routes.js";
import { createAdminRouter } from "@product/admin/routes.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.use("/", createCommonRouter());
  app.use("/", createEmployeeRouter());
  app.use("/", createManagerRouter());
  app.use("/", createFinanceRouter());
  app.use("/", createAdminRouter());

  return app;
};
