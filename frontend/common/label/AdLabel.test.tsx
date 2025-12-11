import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdLabel } from "./AdLabel";

describe("AdLabel", () => {
  it("renders children correctly", () => {
    render(<AdLabel>Label Text</AdLabel>);
    expect(screen.getByText("Label Text")).toBeInTheDocument();
  });

  it("renders label element", () => {
    const { container } = render(<AdLabel>Label</AdLabel>);
    expect(container.querySelector("label")).toBeInTheDocument();
  });

  it("applies label class", () => {
    const { container } = render(<AdLabel>Label</AdLabel>);
    expect(container.firstChild).toHaveClass("label");
  });

  it("applies custom className", () => {
    const { container } = render(<AdLabel className="custom">Label</AdLabel>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
