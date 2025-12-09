describe("Register Page", () => {
  it("should load register UI", () => {
    cy.visit("http://localhost:5173/register");

    cy.contains("Create Account").should("be.visible");
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");
  });

  it("should show error on existing user", () => {
    cy.visit("http://localhost:5173/register");

    cy.get('input[name="name"]').type("Sachin");
    cy.get('input[name="email"]').type("sachin@gmail.com");
    cy.get('input[name="password"]').type("123456");

    cy.contains("SIGN UP").click();

    cy.on("window:alert", (msg) => {
      expect(msg).to.contain("Registration failed");
    });
  });
});
