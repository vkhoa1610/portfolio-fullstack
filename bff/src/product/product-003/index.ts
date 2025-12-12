import { handle } from "./controller.js";
import { BFF_ENDPOINTS } from "@common/config/bff-endpoints.js";

export const bffProduct003 = {
  endpoint: BFF_ENDPOINTS.AUTH_001,
  method: "post",
  handle,
};
