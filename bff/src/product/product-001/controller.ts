import { Request, Response } from "express";

export const handle = async (req: Request, res: Response) => {
  const data = { id: "001", name: "Product 001", price: 999 };
  return res.status(200).json({ success: true, data });
};
