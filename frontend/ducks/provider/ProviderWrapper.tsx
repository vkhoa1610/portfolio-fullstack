"use client";

import { Provider } from "react-redux";
import { store } from "@/ducks/store";
import { I18nProvider } from "@/lib/I18nProvider";
import { AuthProvider, ThemeProvider } from "@/common/context";

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
