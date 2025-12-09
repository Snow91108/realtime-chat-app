describe("Login Page", () => {
  it("should load login UI", () => {
    cy.visit("http://localhost:5173/");

    cy.contains("Login").should("be.visible");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");
  });

  it("should show error on invalid login", () => {
    cy.visit("http://localhost:5173/");

    cy.get('input[name="email"]').type("wrong@test.com");
    cy.get('input[name="password"]').type("wrongpass");

    cy.contains("LOGIN").click();

    cy.on("window:alert", (txt) => {
      expect(txt).to.contain("Login failed");
    });
  });
});
