// Shared types for RTK Query
import {
  BaseQueryFn,
  EndpointBuilder,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";

// RTK Query Builder Type - dùng chung cho tất cả endpoints
export type ApiBuilder = EndpointBuilder<
  BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta>,
  never,
  "api"
>;

// Common API Error Type
export interface ApiError {
  status: number;
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
}
