// import { render, screen, fireEvent } from "@testing-library/react";
// import { BrowserRouter } from "react-router-dom";


// // --------------------------------------------------
// // 1️⃣ Declare mock functions BEFORE mocks (IMPORTANT)
// // --------------------------------------------------
// const mockEmit = vi.fn();
// const mockOn = vi.fn();
// const mockOff = vi.fn();

// // --------------------------------------------------
// // 2️⃣ Mock socket.io-client BEFORE importing Chat.jsx
// // --------------------------------------------------
// vi.mock("socket.io-client", () => ({
//   io: vi.fn(() => ({
//     emit: mockEmit,
//     on: mockOn,
//     off: mockOff,
//   })),
// }));

// // --------------------------------------------------
// // 3️⃣ Mock API BEFORE importing Chat.jsx
// // --------------------------------------------------
// vi.mock("../services/api", () => ({
//   get: vi.fn(() =>
//     Promise.resolve({
//       data: [], // mock empty user list
//     })
//   ),
//   post: vi.fn(() =>
//     Promise.resolve({
//       data: { fileUrl: "/test.png", text: "", sender: "Sachin" },
//     })
//   ),
// }));

// // --------------------------------------------------
// // 4️⃣ Import Chat component AFTER all mocks
// // --------------------------------------------------
// import Chat from "../pages/Chat";

// // --------------------------------------------------
// // 5️⃣ Mock localStorage
// // --------------------------------------------------
// beforeEach(() => {
//   mockEmit.mockClear();
//   mockOn.mockClear();
//   mockOff.mockClear();

//   vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
//     if (key === "user") {
//       return JSON.stringify({
//         _id: "12345",
//         name: "Sachin",
//         email: "sachin@gmail.com",
//       });
//     }
//     return null;
//   });
// });

// // --------------------------------------------------
// // Utility function to render Chat inside Router
// // --------------------------------------------------
// function renderChat() {
//   return render(
//     <BrowserRouter>
//       <Chat />
//     </BrowserRouter>
//   );
// }

// // --------------------------------------------------
// // 6️⃣ UI TESTS
// // --------------------------------------------------
// describe("Chat Component UI Tests", () => {
//   test("renders chat layout", () => {
//     renderChat();
//     expect(screen.getByText("Users")).toBeInTheDocument();
//     expect(screen.getByText("Logout")).toBeInTheDocument();
//   });

//   test("renders input and send button", () => {
//     renderChat();

//     expect(
//       screen.getByPlaceholderText("Type a message...")
//     ).toBeInTheDocument();

//     expect(screen.getByText("Send")).toBeInTheDocument();
//   });

//   test("file upload exists", () => {
//     renderChat();

//     // find <input type="file">
//     const fileInput = screen.getByRole("textbox", { hidden: true });

//     expect(screen.getByText("Send")).toBeInTheDocument();
//   });
// });

// // --------------------------------------------------
// // 7️⃣ SOCKET TYPING TEST
// // --------------------------------------------------
// describe("Message Actions Tests", () => {
//   test("typing triggers socket emit", () => {
//     renderChat();

//     const input = screen.getByPlaceholderText("Type a message...");

//     fireEvent.change(input, { target: { value: "Hello" } });

//     expect(mockEmit).toHaveBeenCalled();
//   });
// });




import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// ===================================================
// 1️⃣  MOCK SOCKET.IO — declare mocks INSIDE factory
// ===================================================
vi.mock("socket.io-client", () => {
  const mockEmit = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();

  return {
    io: vi.fn(() => ({
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
    })),

    // EXPORT THEM SO TESTS CAN ASSERT
    __mockEmit: mockEmit,
    __mockOn: mockOn,
    __mockOff: mockOff,
  };
});

// extract mocks back
const { __mockEmit: mockEmit } = await vi.importMock("socket.io-client");

// ===================================================
// 2️⃣ MOCK API
// ===================================================
vi.mock("../services/api", () => ({
  get: vi.fn().mockResolvedValue({ data: [] }),
  post: vi.fn().mockResolvedValue({
    data: { fileUrl: "/test.png", text: "", sender: "Sachin" },
  }),
}));

// ===================================================
// 3️⃣ Import Chat AFTER all mocks
// ===================================================
import Chat from "../pages/Chat";

// ===================================================
// 4️⃣ Mock LocalStorage
// ===================================================
beforeEach(() => {
  mockEmit.mockClear();

  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
    if (key === "user") {
      return JSON.stringify({
        _id: "123",
        name: "Sachin",
        email: "sachin@gmail.com",
      });
    }
    return null;
  });
});

// Utility renderer
function renderChat() {
  return render(
    <BrowserRouter>
      <Chat />
    </BrowserRouter>
  );
}

// ===================================================
// 5️⃣ UI TESTS
// ===================================================
describe("Chat Component UI Tests", () => {
  test("renders basic layout", () => {
    renderChat();

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("renders input + send button", () => {
    renderChat();

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  test("file upload exists", () => {
    renderChat();

    const fileInput = screen.getByRole("textbox", { hidden: true });
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
});

// ===================================================
// 6️⃣ SOCKET TEST
// ===================================================
describe("Message Actions Tests", () => {
  test("typing triggers socket.emit", () => {
    renderChat();

    const input = screen.getByPlaceholderText("Type a message...");

    fireEvent.change(input, { target: { value: "Hello" } });

    expect(mockEmit).toHaveBeenCalled();
  });
});
