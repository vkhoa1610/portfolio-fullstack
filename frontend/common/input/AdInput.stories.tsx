// import type { Meta, StoryObj } from "@storybook/react";
// import { AdInput } from "./AdInput";

// /**
//  * AdInput là component input chính của hệ thống.
//  * Hỗ trợ nhiều sizes, error states, helper text, và icons.
//  */
// const meta: Meta<typeof AdInput> = {
//   title: "Common/AdInput",
//   component: AdInput,
//   tags: ["autodocs"],
//   argTypes: {
//     size: {
//       control: "select",
//       options: ["sm", "md", "lg"],
//       description: "Kích thước input",
//     },
//     error: {
//       control: "text",
//       description: "Error message (sets error state when provided)",
//     },
//     helperText: {
//       control: "text",
//       description: "Helper text bên dưới input",
//     },
//     placeholder: {
//       control: "text",
//       description: "Placeholder text",
//     },
//     disabled: {
//       control: "boolean",
//       description: "Disable input",
//     },
//     fullWidth: {
//       control: "boolean",
//       description: "Input chiếm full width",
//     },
//   },
// };

// export default meta;
// type Story = StoryObj<typeof AdInput>;

// // ============================================
// // Basic Stories
// // ============================================

// export const Default: Story = {
//   args: {
//     placeholder: "Enter text...",
//   },
// };

// export const WithValue: Story = {
//   args: {
//     defaultValue: "Hello World",
//     placeholder: "Enter text...",
//   },
// };

// // ============================================
// // Size Stories
// // ============================================

// export const Small: Story = {
//   args: {
//     size: "sm",
//     placeholder: "Small input",
//   },
// };

// export const Medium: Story = {
//   args: {
//     size: "md",
//     placeholder: "Medium input",
//   },
// };

// export const Large: Story = {
//   args: {
//     size: "lg",
//     placeholder: "Large input",
//   },
// };

// // ============================================
// // State Stories
// // ============================================

// export const WithError: Story = {
//   args: {
//     error: "This field is required",
//     placeholder: "Enter text...",
//   },
// };

// export const WithHelperText: Story = {
//   args: {
//     helperText: "Please enter your full name",
//     placeholder: "Full name",
//   },
// };

// export const Disabled: Story = {
//   args: {
//     disabled: true,
//     placeholder: "Disabled input",
//   },
// };

// // ============================================
// // Type Stories
// // ============================================

// export const Email: Story = {
//   args: {
//     type: "email",
//     placeholder: "email@example.com",
//   },
// };

// export const Password: Story = {
//   args: {
//     type: "password",
//     placeholder: "Enter password",
//   },
// };

// // ============================================
// // Combination Stories
// // ============================================

// export const AllSizes: Story = {
//   render: () => (
//     <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//       <AdInput size="sm" placeholder="Small input" />
//       <AdInput size="md" placeholder="Medium input" />
//       <AdInput size="lg" placeholder="Large input" />
//     </div>
//   ),
// };

// export const AllStates: Story = {
//   render: () => (
//     <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//       <AdInput placeholder="Normal input" />
//       <AdInput error="Error message" placeholder="Error input" />
//       <AdInput helperText="Helper text" placeholder="With helper" />
//       <AdInput disabled placeholder="Disabled input" />
//     </div>
//   ),
// };

// export const FormExample: Story = {
//   render: () => (
//     <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
//       <div>
//         <label
//           htmlFor="email-input"
//           style={{ color: "white", marginBottom: "0.5rem", display: "block" }}
//         >
//           Email
//         </label>
//         <AdInput id="email-input" type="email" placeholder="email@example.com" />
//       </div>
//       <div>
//         <label
//           htmlFor="password-input"
//           style={{ color: "white", marginBottom: "0.5rem", display: "block" }}
//         >
//           Password
//         </label>
//         <AdInput id="password-input" type="password" placeholder="••••••••" />
//       </div>
//     </div>
//   ),
// };
