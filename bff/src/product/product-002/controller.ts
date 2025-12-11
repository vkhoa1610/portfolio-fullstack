// controller/productBController.js
import { Request, Response } from "express";
import { apiClientGet } from "@common/config/apiClient.js"; // utility bạn đã tạo

export const handle = async (req: Request, res: Response) => {
  try {
    // Call đến controller A qua HTTP
    const response = await apiClientGet("/001", {
      baseURL: "http://localhost:3001",
    });

    return res.status(200).json({
      success: true,
      source: "productB",
      dataFromA: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error calling Product A:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
