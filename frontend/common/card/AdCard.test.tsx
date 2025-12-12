// import React from "react";
// import { render, screen } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import { AdCard } from "./AdCard";

// describe("AdCard", () => {
//   it("renders children correctly", () => {
//     render(<AdCard>Card Content</AdCard>);
//     expect(screen.getByText("Card Content")).toBeInTheDocument();
//   });

//   it("applies base classes", () => {
//     const { container } = render(<AdCard>Content</AdCard>);
//     const card = container.firstChild as HTMLElement;
//     expect(card).toHaveClass("bg-white");
//     expect(card).toHaveClass("rounded-card");
//     expect(card).toHaveClass("shadow-xl");
//   });

//   it("applies custom className", () => {
//     const { container } = render(<AdCard className="custom">Content</AdCard>);
//     expect(container.firstChild).toHaveClass("custom");
//   });

//   it("forwards ref correctly", () => {
//     const ref = React.createRef<HTMLDivElement>();
//     render(<AdCard ref={ref}>Content</AdCard>);
//     expect(ref.current).toBeInstanceOf(HTMLDivElement);
//   });

//   it("spreads additional HTML props", () => {
//     render(<AdCard data-testid="test-card">Content</AdCard>);
//     expect(screen.getByTestId("test-card")).toBeInTheDocument();
//   });
// });
