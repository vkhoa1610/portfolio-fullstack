import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdForm } from "./AdForm";

describe("AdForm", () => {
  it("renders children correctly", () => {
    render(<AdForm>Form Content</AdForm>);
    expect(screen.getByText("Form Content")).toBeInTheDocument();
  });

  it("renders form element", () => {
    const { container } = render(<AdForm>Content</AdForm>);
    expect(container.querySelector("form")).toBeInTheDocument();
  });

  it("applies form class", () => {
    const { container } = render(<AdForm>Content</AdForm>);
    expect(container.firstChild).toHaveClass("form");
  });

  it("applies custom className", () => {
    const { container } = render(<AdForm className="custom">Content</AdForm>);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("calls onSubmit when form is submitted", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    render(
      <AdForm onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </AdForm>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
