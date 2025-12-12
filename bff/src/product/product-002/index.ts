import { handle } from "./controller.js";
import { BFF_ENDPOINTS } from "@common/config/bff-endpoints.js";

export const bffProduct002 = {
  endpoint: BFF_ENDPOINTS.AUTH_002,
  method: "post",
  handle,
};
