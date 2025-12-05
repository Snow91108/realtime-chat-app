// USE BROWSER SAFE SIMPLE-PEER
import Peer from "simple-peer/simplepeer.min.js";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const socket = io("http://localhost:5000");

// Create same private room for both users
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

  // CALL STATES
  const [call, setCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [myStream, setMyStream] = useState(null);

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // refs
  const currentPeer = useRef(null);
  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Load logged user
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored || !stored._id) {
      alert("Login again");
      window.location.href = "/";
      return;
    }
    setUser(stored);
    socket.emit("userOnline", stored._id);
  }, []);

  // Load users (except self)
  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const res = await API.get("/users");
        setUsers(res.data.filter((u) => String(u._id) !== String(user._id)));
      } catch (err) {
        console.error("Load users error", err);
      }
    })();
  }, [user]);

  // Socket handlers
  useEffect(() => {
    socket.on("receiveMessage", (msg) => setMessages((p) => [...p, msg]));
    socket.on("onlineUsers", (list) => setOnlineUsers(list));
    socket.on("userTyping", (name) => setTypingUser(name));
    socket.on("userStoppedTyping", () => setTypingUser(""));
    socket.on("messagesSeen", async () => {
      if (!roomId) return;
      try {
        const res = await API.get(`/messages/${roomId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("load messages on seen", err);
      }
    });

    // incoming call (callee receives this)
    socket.on("incomingCall", ({ signal, from, name, callType, callId }) => {
      setCall({
        isReceivingCall: true,
        from,
        name,
        signal,
        callType,
        callId,
        peer: null,
      });
    });

    // caller receives callee's answer
    socket.on("callAccepted", ({ signal, callId }) => {
      if (currentPeer.current && signal) {
        currentPeer.current.signal(signal);
      }
      setCallAccepted(true);
    });

    // server -> both when call ended
    socket.on("callEnded", () => {
      endCallLocal();
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("onlineUsers");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messagesSeen");
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callEnded");
    };
  }, [roomId]);

  // Join room + load messages
  useEffect(() => {
    if (!roomId || !user) return;
    socket.emit("joinRoom", roomId);
    socket.emit("markSeen", { roomId, viewerName: user.name });
    (async () => {
      try {
        const res = await API.get(`/messages/${roomId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("load chat error", err);
      }
    })();
  }, [roomId, user]);

  // ----------------- SEND TEXT -----------------
  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !roomId) return;

    socket.emit("sendMessage", {
      roomId,
      messageData: { sender: user.name, text: message },
    });

    setMessage("");
    socket.emit("stopTyping", { roomId });
  };

  // ----------------- FILE UPLOAD -----------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !roomId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    formData.append("sender", user.name);

    try {
      const res = await API.post("/upload", formData);
      socket.emit("sendMessage", { roomId, messageData: res.data });
    } catch (err) {
      console.error("upload error", err);
      alert("File upload failed");
    }
  };

  // ----------------- START CALL -----------------
  // targetId is the USER ID (not socket id)
  const startCall = async (targetId, type) => {
    // stop existing tracks if any
    if (myStream) myStream.getTracks().forEach((t) => t.stop());

    // constraints: audio-only for audio call; audio+video for video call
    const constraints = type === "video" ? { video: true, audio: true } : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMyStream(stream);

      // show preview only for video call (or you can show mic level in audio-only)
      if (type === "video" && myVideo.current) myVideo.current.srcObject = stream;

      const peer = new Peer({ initiator: true, trickle: false, stream });

      peer.on("signal", (signalData) => {
        socket.emit("callUser", {
          to: targetId,
          signalData,
          from: user._id,
          name: user.name,
          callType: type,
        });
      });

      peer.on("stream", (remoteStream) => {
        if (userVideo.current) userVideo.current.srcObject = remoteStream;
        // if recording was active when remote arrives, start recorder on remote
        if (isRecording) startRecording(remoteStream);
      });

      peer.on("error", (err) => console.error("peer error (caller):", err));
      peer.on("close", () => {
        // cleanup handled elsewhere
      });

      currentPeer.current = peer;
      setCall((c) => ({ ...c, peer, callType: type }));
      setCallAccepted(false);
      setCallEnded(false);
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("Could not access device. Close other apps using camera/mic or allow permissions.");
    }
  };

  // ----------------- ANSWER CALL -----------------
  const answerCall = async () => {
    if (!call) return;
    const { callType, signal: incomingSignal, from: callerUserId, callId } = call;

    // only request camera if video call
    const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMyStream(stream);
      if (callType === "video" && myVideo.current) myVideo.current.srcObject = stream;

      const peer = new Peer({ initiator: false, trickle: false, stream });

      peer.on("signal", (signalData) => {
        socket.emit("answerCall", { to: callerUserId, signal: signalData, callId });
      });

      peer.on("stream", (remoteStream) => {
        if (userVideo.current) userVideo.current.srcObject = remoteStream;
        if (isRecording) startRecording(remoteStream);
      });

      peer.on("error", (err) => console.error("peer error (callee):", err));

      // feed caller's offer
      peer.signal(incomingSignal);

      currentPeer.current = peer;
      setCallAccepted(true);
      setCall((c) => ({ ...c, peer }));
      setCallEnded(false);
    } catch (err) {
      console.error("answer getUserMedia error:", err);
      alert("Could not access device for answering. Close other apps or allow permissions.");
    }
  };

  // ----------------- REJECT / END CALL -----------------
  const rejectCall = () => {
    if (!call) return;
    socket.emit("endCall", { callId: call.callId });
    setCall(null);
  };

  const endCall = () => {
    if (call?.callId) socket.emit("endCall", { callId: call.callId });
    endCallLocal();
  };

  const endCallLocal = () => {
    setCallAccepted(false);
    setCallEnded(true);

    // stop peer
    try {
      currentPeer.current?.destroy?.();
    } catch (e) {}
    currentPeer.current = null;

    // stop tracks
    if (myStream) {
      myStream.getTracks().forEach((t) => t.stop());
    }
    if (userVideo.current && userVideo.current.srcObject) {
      const st = userVideo.current.srcObject;
      st.getTracks?.()?.forEach((t) => t.stop());
      userVideo.current.srcObject = null;
    }
    if (myVideo.current && myVideo.current.srcObject) {
      myVideo.current.srcObject = null;
    }

    setMyStream(null);
    setCall(null);
    setIsMuted(false);
    setIsCameraOff(false);

    // stop recording if any
    stopRecordingIfNeeded();
  };

  // ----------------- CONTROLS -----------------
  const toggleMute = () => {
    if (!myStream) return;
    const tracks = myStream.getAudioTracks();
    if (!tracks.length) return;
    const newMuted = !isMuted;
    tracks.forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
  };

  const toggleCamera = () => {
    if (!myStream) return;
    const tracks = myStream.getVideoTracks();
    if (!tracks.length) return;
    const newOff = !isCameraOff;
    tracks.forEach((t) => (t.enabled = !newOff));
    setIsCameraOff(newOff);
  };

  // ----------------- RECORDING (remote stream) -----------------
  const startRecording = (remoteStream) => {
    // if already recording, ignore
    if (isRecording || !remoteStream) return;
    try {
      recordedChunksRef.current = [];
      const options = { mimeType: "video/webm; codecs=vp9,opus" };
      const mr = new MediaRecorder(remoteStream, options);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `call_record_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("startRecording error", err);
      alert("Recording not supported or blocked by browser.");
    }
  };

  const stopRecordingIfNeeded = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const toggleRecording = () => {
    // if already recording, stop; else start on remote stream
    if (isRecording) {
      stopRecordingIfNeeded();
      return;
    }
    const remoteStream = userVideo.current?.srcObject;
    if (!remoteStream) {
      alert("No remote stream available to record yet.");
      return;
    }
    startRecording(remoteStream);
  };

  // ---------------- UI ----------------
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a" }}>
      {/* SIDEBAR */}
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

        <div style={{ flex: 1, overflowY: "auto" }}>
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedUser(u);
                setRoomId(createPrivateRoom(user._id, u._id));
                setMessages([]);
              }}
              style={{
                marginTop: 10,
                padding: 12,
                background: "#1e293b",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {u.name} {onlineUsers.includes(u._id) && "🟢"}
              </span>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCall(u._id, "audio");
                  }}
                >
                  📞
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCall(u._id, "video");
                  }}
                >
                  📹
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          style={{
            marginTop: 10,
            padding: 12,
            background: "#ef4444",
            border: "none",
            color: "#fff",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 15, background: "#020617", color: "#fff" }}>
          {selectedUser ? `Chat with ${selectedUser.name}` : "Select User"}
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {typingUser && <p>✍️ {typingUser} is typing...</p>}

          {messages.map((m, i) => {
            const time = m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            const statusIcon =
              m.status === "seen" ? "🔵✔✔" : m.status === "delivered" ? "✔✔" : "✔";

            return (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === user.name ? "flex-end" : "flex-start",
                  background: m.sender === user.name ? "#2563eb" : "#1e293b",
                  padding: 12,
                  borderRadius: 10,
                  color: "#fff",
                  marginBottom: 10,
                  maxWidth: "70%",
                }}
              >
                <strong>{m.sender}: </strong>
                {m.text}

                {m.fileUrl && (
                  <div>
                    <a
                      href={`http://localhost:5000${m.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "yellow" }}
                    >
                      📎 File
                    </a>
                  </div>
                )}

                <div
                  style={{
                    fontSize: 11,
                    marginTop: 5,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{time}</span>
                  {m.sender === user.name && <span>{statusIcon}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <form
          onSubmit={handleSend}
          style={{
            padding: 10,
            background: "#020617",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", { roomId, userName: user?.name });
            }}
            placeholder="Type a message..."
            style={{ flex: 1, padding: 8, borderRadius: 6 }}
          />
          <button type="submit">Send</button>
          <input type="file" onChange={handleFileUpload} />
        </form>

        {/* INCOMING CALL UI */}
        {call?.isReceivingCall && !callAccepted && (
          <div
            style={{
              padding: 12,
              background: "#1e293b",
              color: "#fff",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <strong>{call.name}</strong> is calling... ({call.callType})
            <button onClick={answerCall}>Answer</button>
            <button onClick={rejectCall}>Reject</button>
          </div>
        )}

        {/* LOCAL PREVIEW (show only when we have local stream AND it's a video call) */}
        {myStream && call?.callType === "video" && (
          <div style={{ padding: 8 }}>
            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              style={{ width: 200, borderRadius: 8 }}
            />
          </div>
        )}

        {/* REMOTE VIDEO + CONTROLS (show when call accepted) */}
        {callAccepted && (
          <div style={{ padding: 10, display: "flex", gap: 20, alignItems: "center" }}>
            <video
              ref={userVideo}
              autoPlay
              playsInline
              style={{ width: 320, borderRadius: 8, background: "#000" }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Mute always available */}
              <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>

              {/* Camera toggle only for VIDEO calls */}
              {call?.callType === "video" && (
                <button onClick={toggleCamera}>{isCameraOff ? "Camera On" : "Camera Off"}</button>
              )}

              {/* Record remote */}
              <button onClick={toggleRecording}>{isRecording ? "Stop Recording" : "Record"}</button>

              {/* End */}
              <button onClick={endCall} style={{ background: "#ef4444", color: "#fff" }}>
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
