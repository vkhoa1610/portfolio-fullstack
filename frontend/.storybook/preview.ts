import type { Preview } from "@storybook/react"; // vẫn giữ nguyên
import "../common/styles/tokens.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "gradient",
      values: [
        { name: "gradient", value: "linear-gradient(135deg, #667eea, #764ba2)" },
        { name: "dark", value: "#18181b" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
