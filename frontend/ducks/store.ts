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

/**
 * Wipes every RTK Query slice's cache. Each slice caches by endpoint+args,
 * not by user — with no user id in the cache key, switching identity
 * (logout, or demo-login into a different role without an explicit logout)
 * would otherwise keep serving the PREVIOUS user's cached profile/expenses/
 * etc. straight from the store.
 *
 * Lives here (not in AuthContext, the only current caller) because this is
 * the one place that already knows about every api slice registered in the
 * store — adding a new slice means updating the reducer/middleware lists
 * above anyway, so this stays in sync for free. AuthContext just dispatches
 * it; it doesn't need to know how many slices exist.
 */
export const resetAllApiCaches = () => (dispatch: AppDispatch) => {
  dispatch(apiSlice.util.resetApiState());
  dispatch(authApi.util.resetApiState());
  dispatch(expenseApi.util.resetApiState());
  dispatch(cmsApi.util.resetApiState());
  dispatch(adminApi.util.resetApiState());
  dispatch(privacyApi.util.resetApiState());
  dispatch(financeGdprApi.util.resetApiState());
};
