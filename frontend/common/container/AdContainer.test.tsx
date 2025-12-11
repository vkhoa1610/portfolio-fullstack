import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdContainer } from "./AdContainer";

describe("AdContainer", () => {
  it("renders children correctly", () => {
    render(<AdContainer>Container Content</AdContainer>);
    expect(screen.getByText("Container Content")).toBeInTheDocument();
  });

  it("renders wrapper with wrap class", () => {
    const { container } = render(<AdContainer>Content</AdContainer>);
    expect(container.firstChild).toHaveClass("wrap");
  });

  it("renders blob decorations", () => {
    const { container } = render(<AdContainer>Content</AdContainer>);
    expect(container.querySelector(".blob1")).toBeInTheDocument();
    expect(container.querySelector(".blob2")).toBeInTheDocument();
    expect(container.querySelector(".blob3")).toBeInTheDocument();
  });
});
