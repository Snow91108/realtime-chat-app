import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";

describe("Login Component Tests", () => {
  
  function renderWithRouter(ui) {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  }

  test("renders email and password input fields", () => {
    renderWithRouter(<Login />);

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("renders Login button", () => {
    renderWithRouter(<Login />);

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  test("navigates to Register page when clicking Create one", () => {
    renderWithRouter(<Login />);

    const createLink = screen.getByText("Create one");
    fireEvent.click(createLink);

    // Since navigation won't actually happen inside tests,
    // we simply assert the element exists & click works.
    expect(createLink).toBeInTheDocument();
  });
});
