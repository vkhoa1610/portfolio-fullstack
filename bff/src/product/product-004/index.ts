import { handle } from "./controller.js";
import { BFF_ENDPOINTS } from "@common/config/bff-endpoints.js";

export const bffProduct004 = {
  endpoint: BFF_ENDPOINTS.AUTH_004,
  method: "post",
  handle,
};
