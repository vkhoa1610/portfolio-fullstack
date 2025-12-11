import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdFormGroup } from "./AdFormGroup";

describe("AdFormGroup", () => {
  it("renders children correctly", () => {
    render(<AdFormGroup>Group Content</AdFormGroup>);
    expect(screen.getByText("Group Content")).toBeInTheDocument();
  });

  it("applies inputGroup class", () => {
    const { container } = render(<AdFormGroup>Content</AdFormGroup>);
    expect(container.firstChild).toHaveClass("inputGroup");
  });

  it("applies custom className", () => {
    const { container } = render(<AdFormGroup className="custom">Content</AdFormGroup>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
