import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register.jsx";

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("Register Component Tests", () => {
  test("renders name, email, password fields", () => {
    renderWithRouter(<Register />);

    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("renders SIGN UP button", () => {
    renderWithRouter(<Register />);
    expect(screen.getByText("SIGN UP")).toBeInTheDocument();
  });
});
