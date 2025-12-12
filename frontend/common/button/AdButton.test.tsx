// import React from "react";
// import { render, screen, fireEvent } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import { AdButton } from "./AdButton";

// describe("AdButton", () => {
//   // ============================================
//   // Rendering Tests
//   // ============================================
//   describe("Rendering", () => {
//     it("renders children correctly", () => {
//       render(<AdButton>Click me</AdButton>);
//       expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
//     });

//     it("renders with default props", () => {
//       render(<AdButton>Default</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button).toHaveAttribute("type", "button");
//       expect(button).not.toBeDisabled();
//     });
//   });

//   // ============================================
//   // Variant Tests
//   // ============================================
//   describe("Variants", () => {
//     it("applies primary variant class by default", () => {
//       render(<AdButton>Primary</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/primary/i);
//     });

//     it("applies secondary variant class", () => {
//       render(<AdButton variant="secondary">Secondary</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/secondary/i);
//     });

//     it("applies outline variant class", () => {
//       render(<AdButton variant="outline">Outline</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/outline/i);
//     });

//     it("applies ghost variant class", () => {
//       render(<AdButton variant="ghost">Ghost</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/ghost/i);
//     });
//   });

//   // ============================================
//   // Size Tests
//   // ============================================
//   describe("Sizes", () => {
//     it("applies md size class by default", () => {
//       render(<AdButton>Medium</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/md/i);
//     });

//     it("applies sm size class", () => {
//       render(<AdButton size="sm">Small</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/sm/i);
//     });

//     it("applies lg size class", () => {
//       render(<AdButton size="lg">Large</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/lg/i);
//     });
//   });

//   // ============================================
//   // State Tests
//   // ============================================
//   describe("States", () => {
//     it("disables button when disabled prop is true", () => {
//       render(<AdButton disabled>Disabled</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button).toBeDisabled();
//       expect(button).toHaveAttribute("aria-disabled", "true");
//     });

//     it("shows loading state and disables button", () => {
//       render(<AdButton isLoading>Loading</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button).toBeDisabled();
//       expect(button).toHaveAttribute("aria-busy", "true");
//     });

//     it("applies fullWidth class when fullWidth is true", () => {
//       render(<AdButton fullWidth>Full Width</AdButton>);
//       const button = screen.getByRole("button");
//       expect(button.className).toMatch(/fullWidth/i);
//     });
//   });

//   // ============================================
//   // Interaction Tests
//   // ============================================
//   describe("Interactions", () => {
//     it("calls onClick when clicked", () => {
//       const handleClick = jest.fn();
//       render(<AdButton onClick={handleClick}>Click</AdButton>);

//       fireEvent.click(screen.getByRole("button"));
//       expect(handleClick).toHaveBeenCalledTimes(1);
//     });

//     it("does not call onClick when disabled", () => {
//       const handleClick = jest.fn();
//       render(
//         <AdButton disabled onClick={handleClick}>
//           Disabled
//         </AdButton>
//       );

//       fireEvent.click(screen.getByRole("button"));
//       expect(handleClick).not.toHaveBeenCalled();
//     });

//     it("does not call onClick when isLoading", () => {
//       const handleClick = jest.fn();
//       render(
//         <AdButton isLoading onClick={handleClick}>
//           Loading
//         </AdButton>
//       );

//       fireEvent.click(screen.getByRole("button"));
//       expect(handleClick).not.toHaveBeenCalled();
//     });
//   });

//   // ============================================
//   // Accessibility Tests
//   // ============================================
//   describe("Accessibility", () => {
//     it("has correct aria-disabled when disabled", () => {
//       render(<AdButton disabled>Disabled</AdButton>);
//       expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
//     });

//     it("has correct aria-busy when isLoading", () => {
//       render(<AdButton isLoading>Loading</AdButton>);
//       expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
//     });

//     it("supports custom aria attributes", () => {
//       render(<AdButton aria-label="Custom label">Button</AdButton>);
//       expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Custom label");
//     });
//   });

//   // ============================================
//   // Ref Forwarding Tests
//   // ============================================
//   describe("Ref Forwarding", () => {
//     it("forwards ref to button element", () => {
//       const ref = React.createRef<HTMLButtonElement>();
//       render(<AdButton ref={ref}>Ref Button</AdButton>);

//       expect(ref.current).toBeInstanceOf(HTMLButtonElement);
//       expect(ref.current?.tagName).toBe("BUTTON");
//     });
//   });

//   // ============================================
//   // Type Tests
//   // ============================================
//   describe("Button Types", () => {
//     it("sets type to submit", () => {
//       render(<AdButton type="submit">Submit</AdButton>);
//       expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
//     });

//     it("sets type to reset", () => {
//       render(<AdButton type="reset">Reset</AdButton>);
//       expect(screen.getByRole("button")).toHaveAttribute("type", "reset");
//     });
//   });
// });
