import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdSpinner } from "./AdSpinner";

describe("AdSpinner", () => {
  it("renders spinner element", () => {
    const { container } = render(<AdSpinner />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("applies spinner class", () => {
    const { container } = render(<AdSpinner />);
    expect(container.firstChild).toHaveClass("spinner");
  });

  it("applies small size class", () => {
    const { container } = render(<AdSpinner size="small" />);
    expect(container.firstChild).toHaveClass("small");
  });

  it("applies default size (no small class)", () => {
    const { container } = render(<AdSpinner size="default" />);
    expect(container.firstChild).not.toHaveClass("small");
  });

  it("applies custom className", () => {
    const { container } = render(<AdSpinner className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });
});
