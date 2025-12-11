// src/services/endpoints/callApi1Endpoint.ts
import type { ApiBuilder } from "@/ducks/types";
import type { CallApi1Params, CallApi1Response } from "./types";

export const callApi1 = (builder: ApiBuilder) => ({
  callApi1: builder.query<CallApi1Response, CallApi1Params | void>({
    query: (params) => {
      const queryString = params?.userId ? `?userId=${params.userId}` : "";
      return `/001${queryString}`;
    },
  }),
});
