// import { render, screen } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import { AdErrorBox } from "./AdErrorBox";

// describe("AdErrorBox", () => {
//   it("renders children correctly", () => {
//     render(<AdErrorBox>Error message</AdErrorBox>);
//     expect(screen.getByText("Error message")).toBeInTheDocument();
//   });

//   it("returns null when no children provided", () => {
//     const { container } = render(<AdErrorBox>{null}</AdErrorBox>);
//     expect(container.firstChild).toBeNull();
//   });

//   it("applies errorBox class", () => {
//     const { container } = render(<AdErrorBox>Error</AdErrorBox>);
//     expect(container.firstChild).toHaveClass("errorBox");
//   });

//   it("applies custom className", () => {
//     const { container } = render(<AdErrorBox className="custom">Error</AdErrorBox>);
//     expect(container.firstChild).toHaveClass("custom");
//   });
// });
