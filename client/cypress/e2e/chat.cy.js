describe("Chat Page Tests", () => {
  beforeEach(() => {
    // Mock logged-in user BEFORE loading chat page
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        _id: "12345",
        name: "Sachin",
        email: "sachin@gmail.com",
      })
    );

    window.localStorage.setItem("token", "fake-jwt-token");
  });

  it("should load chat page UI", () => {
    cy.visit("http://localhost:5173/chat");

    cy.contains("Users").should("be.visible");
    cy.contains("Logout").should("be.visible");
  });

  it("should show input box and Send button", () => {
    cy.visit("http://localhost:5173/chat");

    cy.get('input[placeholder="Type a message..."]').should("exist");
    cy.contains("Send").should("exist");
  });

  it("should type message successfully", () => {
    cy.visit("http://localhost:5173/chat");

    cy.get('input[placeholder="Type a message..."]')
      .type("Hello Testing")
      .should("have.value", "Hello Testing");
  });
});
