import express from "express";
import { createRouter } from "./routes.ts"

export const createApp = () => {
  const app = express();
  app.use(express.json());

  const router = createRouter();
  app.use("/", router);

  return app;
};
