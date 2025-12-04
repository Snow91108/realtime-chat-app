import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const socket = io("http://localhost:5000");

// ✅ Same private room for both users
const createPrivateRoom = (id1, id2) => {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
};

const Chat = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ✅ LOAD LOGGED USER
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));

    if (!stored || !stored._id) {
      alert("Please login again");
      window.location.href = "/";
      return;
    }

    setUser(stored);
    socket.emit("userOnline", stored._id);
  }, []);

  // ✅ LOAD USERS (EXCEPT SELF)
  useEffect(() => {
    if (!user?._id) return;

    const loadUsers = async () => {
      try {
        const res = await API.get("/users");
        const filtered = res.data.filter(
          (u) => String(u._id) !== String(user._id)
        );
        setUsers(filtered);
      } catch (err) {
        console.error("User load failed", err);
      }
    };

    loadUsers();
  }, [user]);

  // ✅ SOCKET LISTENERS
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("onlineUsers", (list) => {
      setOnlineUsers(list);
    });

    socket.on("userTyping", (name) => {
      setTypingUser(name);
    });

    socket.on("userStoppedTyping", () => {
      setTypingUser("");
    });

    socket.on("messagesSeen", async () => {
      if (!roomId) return;
      const res = await API.get(`/messages/${roomId}`);
      setMessages(res.data);
    });

    return () => socket.off();
  }, [roomId]);

  // ✅ LOAD MESSAGES + JOIN ROOM
  useEffect(() => {
    if (!roomId || !user?.name) return;

    socket.emit("joinRoom", roomId);

    socket.emit("markSeen", {
      roomId,
      viewerName: user.name,
    });

    const loadChat = async () => {
      const res = await API.get(`/messages/${roomId}`);
      setMessages(res.data);
    };

    loadChat();
  }, [roomId, user]);

  // ✅ SEND MESSAGE
  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      messageData: {
        sender: user.name,
        text: message,
      },
    });

    setMessage("");
    socket.emit("stopTyping", { roomId });
  };

  // ✅ LOGOUT
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a" }}>
      {/* ================= USERS (SIDEBAR) ================= */}
      <div
        style={{
          width: 280,
          background: "#020617",
          color: "#fff",
          padding: 15,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3>Users</h3>

        {/* ✅ USER LIST */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                const newRoom = createPrivateRoom(user._id, u._id);
                setSelectedUser(u);
                setRoomId(newRoom);
                setMessages([]);
              }}
              style={{
                marginTop: 10,
                padding: 10,
                background: selectedUser?._id === u._id ? "#2563eb" : "#1e293b",
                cursor: "pointer",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{u.name}</span>
              {onlineUsers.includes(u._id) && " 🟢"}
            </div>
          ))}
        </div>

        {/* ✅ LOGOUT BUTTON (BOTTOM SIDEBAR) */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 15,
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "#ef4444",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* ================= CHAT ================= */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <div style={{ padding: 15, background: "#020617", color: "#fff" }}>
          {selectedUser ? `Chat with ${selectedUser.name}` : "Select User"}
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {typingUser && <p>✍️ {typingUser} is typing...</p>}

          {messages.map((m, i) => {
            const time = new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusIcon =
              m.status === "seen"
                ? "🔵✔✔"
                : m.status === "delivered"
                ? "✔✔"
                : "✔";

            return (
              <div
                key={i}
                style={{
                  alignSelf:
                    m.sender === user.name ? "flex-end" : "flex-start",
                  background:
                    m.sender === user.name ? "#2563eb" : "#1e293b",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  marginBottom: "10px",
                  maxWidth: "70%",
                }}
              >
                {/* ✅ TEXT MESSAGE */}
                {m.text && (
                  <div>
                    <strong>{m.sender}:</strong> {m.text}
                  </div>
                )}

                {/* ✅ IMAGE MESSAGE */}
                {m.fileUrl && m.fileType?.startsWith("image") && (
                  <img
                    src={`http://localhost:5000${m.fileUrl}`}
                    alt="img"
                    style={{ width: "200px", marginTop: 5, borderRadius: 8 }}
                  />
                )}

                {/* ✅ FILE MESSAGE */}
                {m.fileUrl && !m.fileType?.startsWith("image") && (
                  <a
                    href={`http://localhost:5000${m.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "yellow", marginTop: 5, display: "block" }}
                  >
                    📎 Download File
                  </a>
                )}

                <div
                  style={{
                    fontSize: "11px",
                    color: "#cbd5f5",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "4px",
                  }}
                >
                  <span>{time}</span>
                  {m.sender === user.name && <span>{statusIcon}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= INPUT ================= */}
        <form onSubmit={handleSend} style={{ padding: 10, background: "#020617" }}>
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", {
                roomId,
                userName: user.name,
              });
            }}
            placeholder="Type..."
            style={{ width: "70%" }}
          />
          <button type="submit">Send</button>

          {/* ✅ FILE UPLOAD */}
          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file || !roomId) return;

              const formData = new FormData();
              formData.append("file", file);
              formData.append("roomId", roomId);
              formData.append("sender", user.name);

              const res = await API.post("/upload", formData);

              socket.emit("sendMessage", {
                roomId,
                messageData: res.data,
              });
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default Chat;
