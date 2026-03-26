# 💬 BudPing — Realtime Chat App

> A full-stack realtime chat application with private messaging, audio/video calling, file sharing, and live presence indicators — built with React, Node.js, Socket.IO, and MongoDB.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Socket Events](#-socket-events)
- [Workflow](#-workflow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Roadmap](#-roadmap)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure JWT-based register & login |
| 💬 **Private Messaging** | One-to-one real-time chat via Socket.IO rooms |
| 📁 **File Sharing** | Upload and share images, PDFs, and other files |
| 📡 **Online Presence** | Live online/offline user status indicators |
| ✍️ **Typing Indicators** | Real-time "user is typing…" notifications |
| ✅ **Message Status** | Sent → Delivered → Seen tick tracking |
| 📞 **Audio Calling** | Peer-to-peer audio calls via WebRTC (simple-peer) |
| 🎥 **Video Calling** | Peer-to-peer video calls via WebRTC (simple-peer) |
| 🛡️ **Protected Routes** | Chat page is only accessible to authenticated users |

---

## 🛠 Tech Stack

### Frontend (`/client`)
| Layer | Technology |
|---|---|
| Framework | React 19 (Vite) |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| Realtime | Socket.IO Client v4 |
| P2P Calls | simple-peer (WebRTC) |
| Unit Tests | Vitest + React Testing Library |
| E2E Tests | Cypress |
| Linting | ESLint |

### Backend (`/server`)
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express v5 |
| Database | MongoDB via Mongoose v9 |
| Realtime | Socket.IO v4 |
| Auth | JSON Web Tokens (JWT) + bcrypt |
| File Upload | Multer |
| Dev Server | Nodemon |
| Config | dotenv |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                    CLIENT (React)                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Login / │  │  Chat    │  │  Video / Audio │  │
│  │ Register │  │  Page    │  │  Call Modal    │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │ REST        │ Socket.IO       │ WebRTC    │
└───────┼─────────────┼────────────────┼───────────┘
        │             │                │
        ▼             ▼                ▼
┌──────────────────────────────────────────────────┐
│              SERVER (Express + Socket.IO)         │
│                                                  │
│  ┌───────────┐   ┌───────────────────────────┐  │
│  │ REST API  │   │   Socket.IO Event Hub     │  │
│  │ /api/auth │   │ - userOnline / disconnect │  │
│  │ /api/users│   │ - joinRoom / sendMessage  │  │
│  │ /api/msgs │   │ - markSeen / typing       │  │
│  │ /api/upload│  │ - callUser / answerCall   │  │
│  └─────┬─────┘  └───────────┬───────────────┘  │
│        │                    │                   │
└────────┼────────────────────┼───────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────────────────────────────────────┐
│              MongoDB (Atlas)                     │
│   Users  │  Messages  │  Calls                  │
└──────────────────────────────────────────────────┘
```

### Communication Flow

```
User A (Client)                     Server                    User B (Client)
    │                                  │                           │
    │── POST /api/auth/login ──────────►│                           │
    │◄── { token, user } ──────────────│                           │
    │                                  │                           │
    │── socket: userOnline(userId) ───►│◄── socket: userOnline ────│
    │◄── socket: onlineUsers([...]) ───│──► socket: onlineUsers ──►│
    │                                  │                           │
    │── socket: joinRoom(roomId) ─────►│◄── socket: joinRoom ──────│
    │                                  │                           │
    │── socket: sendMessage({...}) ───►│ [Save to MongoDB]         │
    │                                  │──► socket: receiveMessage─►│
    │                                  │                           │
    │── socket: callUser({to, signal})►│                           │
    │                                  │──► socket: incomingCall ──►│
    │                                  │◄── socket: answerCall ────│
    │◄── socket: callAccepted ─────────│                           │
    │◄──────── WebRTC P2P Stream ───────────────────────────────────►│
```

---

## 📁 Project Structure

```
realtime-chat-app/
│
├── client/                          # React frontend (Vite)
│   ├── public/
│   ├── cypress/                     # E2E tests
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Auth layout wrapper
│   │   │   ├── Login.jsx            # Login form
│   │   │   ├── Register.jsx         # Registration form
│   │   │   └── Chat.jsx             # Main chat interface (messages, calls)
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # JWT-guarded route wrapper
│   │   ├── services/
│   │   │   └── api.js               # Axios instance (baseURL: :5000/api)
│   │   ├── tests/                   # Vitest unit tests
│   │   ├── types/                   # JSDoc / type definitions
│   │   ├── App.jsx                  # Root router
│   │   ├── main.jsx                 # React entry point
│   │   ├── index.css                # Global styles
│   │   └── auth.css                 # Auth page styles
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── cypress.config.js
│   └── package.json
│
└── server/                          # Node.js / Express backend
    ├── controllers/
    │   └── authController.js        # Register & login logic
    ├── middleware/
    │   └── auth.js                  # JWT verification middleware
    ├── models/
    │   ├── User.js                  # User schema
    │   ├── Message.js               # Message schema (text, file, status)
    │   └── Call.js                  # Call log schema
    ├── routes/
    │   ├── authRoutes.js            # POST /register, POST /login
    │   ├── userRoutes.js            # GET /users (all users)
    │   ├── messageRoutes.js         # GET /messages/:roomId
    │   ├── uploadRoutes.js          # POST /upload (Multer)
    │   └── protectedRoutes.js       # Token-protected test route
    ├── uploads/                     # Static file storage
    ├── server.js                    # App entry: Express + Socket.IO + Mongoose
    ├── .env                         # Environment config
    └── package.json
```

---

## 🗄 Data Models

### User
```js
{
  name:      String  // required
  email:     String  // required, unique, lowercase
  password:  String  // required, bcrypt hashed, min 6 chars
  createdAt: Date
  updatedAt: Date
}
```

### Message
```js
{
  roomId:    String   // "<userId1>_<userId2>" sorted
  sender:    String   // sender's name/id
  text:      String   // optional text content
  fileUrl:   String   // optional file path
  fileType:  String   // "image" | "pdf" | etc.
  status:    String   // "sent" | "delivered" | "seen"
  createdAt: Date
  updatedAt: Date
}
```

### Call
```js
{
  from:      String   // caller userId
  to:        String   // recipient userId
  callType:  String   // "audio" | "video"
  status:    String   // "started" | "connected" | "ended"
  endedAt:   Date     // set when call ends
  createdAt: Date
}
```

---

## 🔌 API Reference

### Auth Routes — `/api/auth`
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/register` | `{ name, email, password }` | Create a new user account |
| `POST` | `/login` | `{ email, password }` | Authenticate and receive JWT token |

### User Routes — `/api/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ JWT | Get all registered users |

### Message Routes — `/api/messages`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/:roomId` | ✅ JWT | Fetch message history for a room |

### Upload Routes — `/api/upload`
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/` | `multipart/form-data` | Upload a file, returns `{ fileUrl, fileType }` |

### Static Files
```
GET /uploads/:filename  →  Serve uploaded files directly
```

---

## ⚡ Socket Events

### Client → Server (Emit)
| Event | Payload | Description |
|---|---|---|
| `userOnline` | `userId` | Register user in online map |
| `joinRoom` | `roomId` | Join a private chat room |
| `sendMessage` | `{ roomId, messageData }` | Send a message (saved to DB) |
| `markSeen` | `{ roomId, viewerName }` | Mark messages as seen |
| `typing` | `{ roomId, userName }` | Notify peer user is typing |
| `stopTyping` | `{ roomId }` | Notify peer stopped typing |
| `callUser` | `{ to, signalData, from, name, callType }` | Initiate a call |
| `answerCall` | `{ to, signal, callId }` | Accept an incoming call |
| `endCall` | `{ callId, to }` | Terminate an active call |

### Server → Client (On)
| Event | Payload | Description |
|---|---|---|
| `onlineUsers` | `userId[]` | Broadcast updated online user list |
| `receiveMessage` | `Message` | Deliver a new message to room members |
| `messagesSeen` | — | Notify room that messages were seen |
| `userTyping` | `userName` | Inform peer someone is typing |
| `userStoppedTyping` | — | Inform peer typing has stopped |
| `incomingCall` | `{ signal, from, name, callType, callId }` | Notify of an incoming call |
| `callAccepted` | `{ signal, callId }` | Confirm call was answered |
| `callEnded` | — | Notify that the call has ended |

---

## 🔄 Workflow

### 1. Authentication Flow
```
User visits "/"
  → Login page shown
  → POST /api/auth/login
  → JWT token stored in localStorage
  → Redirect to /chat (ProtectedRoute passes)
```

### 2. Messaging Flow
```
User opens Chat page
  → GET /api/users  (load contact list)
  → socket.emit("userOnline", userId)
  → User picks a contact
  → roomId = sorted([myId, theirId]).join("_")
  → socket.emit("joinRoom", roomId)
  → GET /api/messages/:roomId  (load history)
  → User types → socket.emit("typing")
  → User sends → socket.emit("sendMessage")
  → Server saves to MongoDB, emits "receiveMessage" to room
  → Receiver opens chat → socket.emit("markSeen")
  → Status updates: sent → delivered → seen
```

### 3. File Sharing Flow
```
User selects a file
  → POST /api/upload (multipart/form-data)
  → Server stores file in /uploads via Multer
  → Returns { fileUrl, fileType }
  → socket.emit("sendMessage") with fileUrl & fileType
  → Receiver renders image preview or file download link
```

### 4. Audio / Video Call Flow
```
Caller clicks "Call" button
  → navigator.mediaDevices.getUserMedia()  (get local stream)
  → simple-peer creates offer signal
  → socket.emit("callUser", { to, signalData, from, name, callType })
  → Server looks up receiver's socketId from onlineUsers map
  → Server emits "incomingCall" to receiver

Receiver accepts call
  → simple-peer creates answer signal
  → socket.emit("answerCall", { to, signal, callId })
  → Server emits "callAccepted" to caller
  → simple-peer completes handshake → P2P stream established

Either party ends call
  → socket.emit("endCall", { callId, to })
  → Server updates Call.status = "ended" in DB
  → Server emits "callEnded" to other party
  → Both sides stop tracks and destroy peer
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- A **MongoDB Atlas** cluster (or local MongoDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Set Up the Server
```bash
cd server
npm install
```

Create a `.env` file in `/server`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

Start the server:
```bash
npm run dev      # Development (nodemon)
# or
npm start        # Production
```

### 3. Set Up the Client
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

### 4. Open the App
Navigate to **http://localhost:5173** in your browser.

> ⚠️ Make sure the server is running on port **5000** before launching the client.

---

## 🔑 Environment Variables

| Variable | Location | Description |
|---|---|---|
| `PORT` | `server/.env` | Port for the Express server (default: 5000) |
| `MONGO_URI` | `server/.env` | MongoDB connection string |
| `JWT_SECRET` | `server/.env` | Secret key for signing JWT tokens |

---

## 🧪 Testing

### Unit Tests (Vitest)
```bash
cd client
npm test            # Run all unit tests
npm run test:watch  # Watch mode
```

### End-to-End Tests (Cypress)
```bash
cd client
npx cypress open    # Interactive mode
npx cypress run     # Headless mode
```

---

## 🗺 Roadmap

- [ ] Group chat rooms
- [ ] Message reactions (emoji)
- [ ] Push notifications
- [ ] Dark / Light theme toggle
- [ ] Message search
- [ ] Read receipts for group chats
- [ ] Docker Compose setup for one-command deployment
- [ ] Production deployment guide (Render + Vercel)

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

> Built with ❤️ using React, Node.js, Socket.IO & WebRTC
