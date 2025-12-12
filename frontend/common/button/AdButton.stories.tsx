// import type { Meta, StoryObj } from "@storybook/react";
// import { AdButton } from "./AdButton";

// /**
//  * AdButton là component button chính của hệ thống.
//  * Hỗ trợ nhiều variants, sizes, và states khác nhau.
//  */
// const meta: Meta<typeof AdButton> = {
//   title: "Common/AdButton",
//   component: AdButton,
//   tags: ["autodocs"],
//   argTypes: {
//     variant: {
//       control: "select",
//       options: ["primary", "secondary", "outline", "ghost"],
//       description: "Visual style của button",
//     },
//     size: {
//       control: "select",
//       options: ["sm", "md", "lg"],
//       description: "Kích thước button",
//     },
//     isLoading: {
//       control: "boolean",
//       description: "Hiển thị loading spinner",
//     },
//     disabled: {
//       control: "boolean",
//       description: "Disable button",
//     },
//     fullWidth: {
//       control: "boolean",
//       description: "Button chiếm full width",
//     },
//     children: {
//       control: "text",
//       description: "Nội dung button",
//     },
//   },
// };

// export default meta;
// type Story = StoryObj<typeof AdButton>;

// // ============================================
// // Basic Stories
// // ============================================

// export const Default: Story = {
//   args: {
//     children: "Button",
//   },
// };

// export const Primary: Story = {
//   args: {
//     variant: "primary",
//     children: "Primary Button",
//   },
// };

// export const Secondary: Story = {
//   args: {
//     variant: "secondary",
//     children: "Secondary Button",
//   },
// };

// export const Outline: Story = {
//   args: {
//     variant: "outline",
//     children: "Outline Button",
//   },
// };

// export const Ghost: Story = {
//   args: {
//     variant: "ghost",
//     children: "Ghost Button",
//   },
// };

// // ============================================
// // Size Stories
// // ============================================

// export const Small: Story = {
//   args: {
//     size: "sm",
//     children: "Small Button",
//   },
// };

// export const Medium: Story = {
//   args: {
//     size: "md",
//     children: "Medium Button",
//   },
// };

// export const Large: Story = {
//   args: {
//     size: "lg",
//     children: "Large Button",
//   },
// };

// // ============================================
// // State Stories
// // ============================================

// export const Disabled: Story = {
//   args: {
//     disabled: true,
//     children: "Disabled Button",
//   },
// };

// export const Loading: Story = {
//   args: {
//     isLoading: true,
//     children: "Loading...",
//   },
// };

// export const FullWidth: Story = {
//   args: {
//     fullWidth: true,
//     children: "Full Width Button",
//   },
// };

// // ============================================
// // Combination Stories
// // ============================================

// export const AllVariants: Story = {
//   render: () => (
//     <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//       <AdButton variant="primary">Primary</AdButton>
//       <AdButton variant="secondary">Secondary</AdButton>
//       <AdButton variant="outline">Outline</AdButton>
//       <AdButton variant="ghost">Ghost</AdButton>
//     </div>
//   ),
// };

// export const AllSizes: Story = {
//   render: () => (
//     <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
//       <AdButton size="sm">Small</AdButton>
//       <AdButton size="md">Medium</AdButton>
//       <AdButton size="lg">Large</AdButton>
//     </div>
//   ),
// };

// export const LoadingStates: Story = {
//   render: () => (
//     <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//       <AdButton isLoading variant="primary">
//         Primary
//       </AdButton>
//       <AdButton isLoading variant="secondary">
//         Secondary
//       </AdButton>
//       <AdButton isLoading variant="outline">
//         Outline
//       </AdButton>
//     </div>
//   ),
// };
