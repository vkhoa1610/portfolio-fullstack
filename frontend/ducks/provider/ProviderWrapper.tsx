"use client";

import { Provider } from "react-redux";
import { store } from "@/ducks/store";

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
