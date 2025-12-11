import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdSubtitle } from "./AdSubtitle";

describe("AdSubtitle", () => {
  it("renders children correctly", () => {
    render(<AdSubtitle>Subtitle Text</AdSubtitle>);
    expect(screen.getByText("Subtitle Text")).toBeInTheDocument();
  });

  it("renders p element", () => {
    const { container } = render(<AdSubtitle>Subtitle</AdSubtitle>);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("applies subtitle class", () => {
    const { container } = render(<AdSubtitle>Subtitle</AdSubtitle>);
    expect(container.firstChild).toHaveClass("subtitle");
  });

  it("applies small size class", () => {
    const { container } = render(<AdSubtitle size="small">Subtitle</AdSubtitle>);
    expect(container.firstChild).toHaveClass("subtitleSmall");
  });

  it("applies custom className", () => {
    const { container } = render(<AdSubtitle className="custom">Subtitle</AdSubtitle>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
