// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs"; // ← ĐỔI Ở ĐÂY

const config: StorybookConfig = {
  stories: ["../common/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs", // ← ĐỔI THÀNH @storybook/nextjs
    options: {
      nextConfigPath: "../next.config.mjs", // nếu bạn dùng next.config.mjs
      // hoặc "../next.config.js" nếu dùng .js
    },
  },
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag",
  },
  // Thêm dòng này để tránh lỗi vite final config
  viteFinal: async (config) => {
    return config;
  },
};

export default config;
