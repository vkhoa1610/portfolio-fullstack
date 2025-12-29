"use client";

import { Provider } from "react-redux";
import { store } from "@/ducks/store";
import { I18nProvider } from "@/lib/I18nProvider";
import { AuthProvider } from "@/common/context";

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <I18nProvider>{children}</I18nProvider>
      </AuthProvider>
    </Provider>
  );
}
