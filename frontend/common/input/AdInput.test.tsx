import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdInput } from "./AdInput";

describe("AdInput", () => {
  // ============================================
  // Rendering Tests
  // ============================================
  describe("Rendering", () => {
    it("renders input element", () => {
      render(<AdInput aria-label="test input" />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<AdInput placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<AdInput className="custom-class" aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input.className).toMatch(/custom-class/);
    });
  });

  // ============================================
  // Size Tests
  // ============================================
  describe("Sizes", () => {
    it("applies md size class by default", () => {
      render(<AdInput aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input.className).toMatch(/md/i);
    });

    it("applies sm size class", () => {
      render(<AdInput size="sm" aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input.className).toMatch(/sm/i);
    });

    it("applies lg size class", () => {
      render(<AdInput size="lg" aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input.className).toMatch(/lg/i);
    });
  });

  // ============================================
  // Error State Tests
  // ============================================
  describe("Error State", () => {
    it("applies error class when error is true", () => {
      render(<AdInput error aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input.className).toMatch(/error/i);
    });

    it("shows error message when error and errorMessage provided", () => {
      render(<AdInput error errorMessage="This field is required" aria-label="test" />);
      expect(screen.getByRole("alert")).toHaveTextContent("This field is required");
    });

    it("sets aria-invalid when error is true", () => {
      render(<AdInput error aria-label="test" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    });
  });

  // ============================================
  // Helper Text Tests
  // ============================================
  describe("Helper Text", () => {
    it("shows helper text when provided", () => {
      render(<AdInput helperText="Enter your email" aria-label="test" />);
      expect(screen.getByText("Enter your email")).toBeInTheDocument();
    });

    it("hides helper text when error is shown", () => {
      render(
        <AdInput error errorMessage="Error!" helperText="This should be hidden" aria-label="test" />
      );
      expect(screen.queryByText("This should be hidden")).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe("Accessibility", () => {
    it("generates unique id for accessibility", () => {
      render(<AdInput aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id");
    });

    it("links error message with aria-describedby", () => {
      render(<AdInput error errorMessage="Error!" aria-label="test" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby");
    });

    it("supports custom id", () => {
      render(<AdInput id="custom-id" aria-label="test" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("id", "custom-id");
    });
  });

  // ============================================
  // Ref Forwarding Tests
  // ============================================
  describe("Ref Forwarding", () => {
    it("forwards ref to input element", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<AdInput ref={ref} aria-label="test" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe("INPUT");
    });
  });

  // ============================================
  // Input Types Tests
  // ============================================
  describe("Input Types", () => {
    it("supports type text", () => {
      render(<AdInput type="text" aria-label="test" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("supports type email", () => {
      render(<AdInput type="email" aria-label="email" />);
      // Email inputs still have textbox role
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("supports type password", () => {
      render(<AdInput type="password" aria-label="password" />);
      // Password inputs don't have textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  // ============================================
  // Disabled State Tests
  // ============================================
  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      render(<AdInput disabled aria-label="test" />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });
});
