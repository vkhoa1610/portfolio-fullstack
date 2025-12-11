import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdLogo } from "./AdLogo";

describe("AdLogo", () => {
  it("renders children correctly", () => {
    render(<AdLogo>Logo</AdLogo>);
    expect(screen.getByText("Logo")).toBeInTheDocument();
  });

  it("applies logo class", () => {
    const { container } = render(<AdLogo>Logo</AdLogo>);
    expect(container.firstChild).toHaveClass("logo");
  });

  it("applies small size class", () => {
    const { container } = render(<AdLogo size="small">Logo</AdLogo>);
    expect(container.firstChild).toHaveClass("logoSmall");
  });

  it("applies tiny size class", () => {
    const { container } = render(<AdLogo size="tiny">Logo</AdLogo>);
    expect(container.firstChild).toHaveClass("logoTiny");
  });

  it("applies custom className", () => {
    const { container } = render(<AdLogo className="custom">Logo</AdLogo>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
