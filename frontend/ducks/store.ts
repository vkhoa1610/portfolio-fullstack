import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import { apiSlice } from "./apiSlice";
import { authApi } from "./auth/authApi";
import { expenseApi } from "./expenses/expenseApi";
import { cmsApi } from "./cms/cmsApi";
import { adminApi } from "./admin/adminApi";
import { privacyApi } from "./privacy/privacyApi";
import { financeGdprApi } from "./finance-gdpr/financeGdprApi";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [cmsApi.reducerPath]: cmsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [privacyApi.reducerPath]: privacyApi.reducer,
    [financeGdprApi.reducerPath]: financeGdprApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(authApi.middleware)
      .concat(expenseApi.middleware)
      .concat(cmsApi.middleware)
      .concat(adminApi.middleware)
      .concat(privacyApi.middleware)
      .concat(financeGdprApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
