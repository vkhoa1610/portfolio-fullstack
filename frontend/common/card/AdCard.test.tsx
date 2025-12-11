import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdCard } from "./AdCard";

describe("AdCard", () => {
  it("renders children correctly", () => {
    render(<AdCard>Card Content</AdCard>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("applies default size class", () => {
    const { container } = render(<AdCard>Content</AdCard>);
    expect(container.firstChild).toHaveClass("card");
  });

  it("applies small size class", () => {
    const { container } = render(<AdCard size="small">Content</AdCard>);
    expect(container.firstChild).toHaveClass("cardSmall");
  });

  it("applies large size class", () => {
    const { container } = render(<AdCard size="large">Content</AdCard>);
    expect(container.firstChild).toHaveClass("cardLarge");
  });

  it("applies gradient border class when enabled", () => {
    const { container } = render(<AdCard gradientBorder>Content</AdCard>);
    expect(container.firstChild).toHaveClass("cardGradientBorder");
  });

  it("applies custom className", () => {
    const { container } = render(<AdCard className="custom">Content</AdCard>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
