import { Request, Response } from "express";
import { signIn } from "@common/config/cognito-service.ts";

export const handle = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await signIn(email, password);
    console.log(result)
    return res.status(200).json({"result":0});
  } catch (err: any) {
    console.error("❌ Error login Cognito service:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
