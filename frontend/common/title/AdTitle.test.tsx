// import { render, screen } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import { AdTitle } from "./AdTitle";

// describe("AdTitle", () => {
//   it("renders children correctly", () => {
//     render(<AdTitle>Page Title</AdTitle>);
//     expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page Title");
//   });

//   it("renders h1 element", () => {
//     render(<AdTitle>Title</AdTitle>);
//     expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
//   });

//   it("applies title class", () => {
//     const { container } = render(<AdTitle>Title</AdTitle>);
//     expect(container.firstChild).toHaveClass("title");
//   });

//   it("applies large size class", () => {
//     const { container } = render(<AdTitle size="large">Title</AdTitle>);
//     expect(container.firstChild).toHaveClass("titleLarge");
//   });

//   it("applies small size class", () => {
//     const { container } = render(<AdTitle size="small">Title</AdTitle>);
//     expect(container.firstChild).toHaveClass("titleSmall");
//   });

//   it("applies custom className", () => {
//     const { container } = render(<AdTitle className="custom">Title</AdTitle>);
//     expect(container.firstChild).toHaveClass("custom");
//   });
// });
