import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdFooter } from "./AdFooter";

describe("AdFooter", () => {
  it("renders children correctly", () => {
    render(<AdFooter>Footer Content</AdFooter>);
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("applies footer class", () => {
    const { container } = render(<AdFooter>Footer</AdFooter>);
    expect(container.firstChild).toHaveClass("footer");
  });

  it("applies custom className", () => {
    const { container } = render(<AdFooter className="custom">Footer</AdFooter>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
