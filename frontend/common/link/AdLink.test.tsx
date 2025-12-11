import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdLink } from "./AdLink";

describe("AdLink", () => {
  it("renders children correctly", () => {
    render(<AdLink>Link Text</AdLink>);
    expect(screen.getByText("Link Text")).toBeInTheDocument();
  });

  it("renders anchor element", () => {
    render(<AdLink>Link</AdLink>);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("applies link class", () => {
    const { container } = render(<AdLink>Link</AdLink>);
    expect(container.firstChild).toHaveClass("link");
  });

  it("applies default href", () => {
    render(<AdLink>Link</AdLink>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#");
  });

  it("applies custom href", () => {
    render(<AdLink href="/custom">Link</AdLink>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/custom");
  });

  it("applies right align class", () => {
    const { container } = render(<AdLink align="right">Link</AdLink>);
    expect(container.firstChild).toHaveClass("right");
  });

  it("applies custom className", () => {
    const { container } = render(<AdLink className="custom">Link</AdLink>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
