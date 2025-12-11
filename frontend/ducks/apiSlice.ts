// src/services/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Import các endpoint đã tách riêng
import { callApi1 } from "./slice/callApi1Endpoint";
import { authEndpoints } from "./login/authEndpoints";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/",
    // credentials: "include", // nếu cần cookie/session
  }),
  endpoints: (builder) => ({
    // Tách riêng từng nhóm endpoint
    ...callApi1(builder),
    ...authEndpoints(builder),
  }),
});

// Export hooks (sẽ được re-export ở file index nếu muốn gọn)
export const { useCallApi1Query, useLoginMutation } = apiSlice;
