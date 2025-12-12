"use client";

import { Provider } from "react-redux";
import { store } from "@/ducks/store";
import { I18nProvider } from "@/lib/I18nProvider";

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>{children}</I18nProvider>
    </Provider>
  );
}
