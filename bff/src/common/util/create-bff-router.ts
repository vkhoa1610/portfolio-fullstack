import express, { RequestHandler } from 'express';

interface BffConfig {
  endpoint: string;
  method: string;
  handle: RequestHandler;
}

export const createBffRouter = (label: string, bffList: BffConfig[]) => {
  const router = express.Router();

  bffList.forEach((bff) => {
    const method = bff.method.toLowerCase();
    if (typeof (router as any)[method] === 'function') {
      (router as any)[method](bff.endpoint, bff.handle);
      console.log(`✅ [${label}] [${bff.method.toUpperCase()}] ${bff.endpoint}`);
    }
  });

  return router;
};
