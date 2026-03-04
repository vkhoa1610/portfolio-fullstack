import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import { apiSlice } from "./apiSlice";
import { authApi } from "./auth/authApi";
import { expenseApi } from "./expenses/expenseApi";
import { cmsApi } from "./cms/cmsApi";
import { adminApi } from "./admin/adminApi";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [cmsApi.reducerPath]: cmsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(authApi.middleware)
      .concat(expenseApi.middleware)
      .concat(cmsApi.middleware)
      .concat(adminApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
