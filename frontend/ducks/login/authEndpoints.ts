// src/services/endpoints/authEndpoints.ts
import type { ApiBuilder } from "@/ducks/types";
import type { LoginRequest, LoginResponse } from "./types";

export const authEndpoints = (builder: ApiBuilder) => ({
  login: builder.mutation<LoginResponse, LoginRequest>({
    query: (body) => ({
      url: "/login",
      method: "POST",
      body,
    }),
  }),

  // Có thể thêm logout, refreshToken, register... ở đây
});
