// USE BROWSER SAFE SIMPLE-PEER
import Peer from "simple-peer/simplepeer.min.js";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import ChatLayout from "../components/ChatLayout";

const socket = io("http://localhost:5000");

// Create same private room for both users (sorted IDs)
const createPrivateRoom = (id1, id2) =>
  id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

const Chat = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Toast
  const [toast, setToast] = useState(null);

  // Call states
  const [call, setCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [myStream, setMyStream] = useState(null);

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const currentPeer = useRef(null);
  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const typingTimerRef = useRef(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load logged user
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored || !stored._id) {
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
        showToast("Failed to load contacts", "error");
      }
    })();
  }, [user]);

  // Socket handlers
  useEffect(() => {
    socket.on("receiveMessage", (msg) => setMessages((p) => [...p, msg]));
    socket.on("onlineUsers", (list) => setOnlineUsers(list));

    socket.on("userTyping", (name) => {
      setTypingUser(name);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(""), 2500);
    });
    socket.on("userStoppedTyping", () => setTypingUser(""));

    socket.on("messagesSeen", async () => {
      if (!roomId) return;
      try {
        const res = await API.get(`/messages/${roomId}`);
        setMessages(res.data);
      } catch (_) {}
    });

    socket.on("incomingCall", ({ signal, from, name, callType, callId }) => {
      setCall({ isReceivingCall: true, from, name, signal, callType, callId, peer: null });
      showToast(`📞 Incoming ${callType} call from ${name}`, "info");
    });

    socket.on("callAccepted", ({ signal, callId }) => {
      if (currentPeer.current && signal) currentPeer.current.signal(signal);
      setCallAccepted(true);
    });

    socket.on("callEnded", () => endCallLocal());

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
    setMessagesLoading(true);
    socket.emit("joinRoom", roomId);
    socket.emit("markSeen", { roomId, viewerName: user.name });
    (async () => {
      try {
        const res = await API.get(`/messages/${roomId}`);
        setMessages(res.data);
      } catch (_) {}
      finally { setMessagesLoading(false); }
    })();
  }, [roomId, user]);

  // ── SEND TEXT ──────────────────────────────────
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

  // ── TYPING ──────────────────────────────────────
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomId, userName: user?.name });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(
      () => socket.emit("stopTyping", { roomId }),
      1500
    );
  };

  // ── FILE UPLOAD ──────────────────────────────────
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
      showToast("File sent!", "success");
    } catch (_) {
      showToast("File upload failed", "error");
    }
    e.target.value = "";
  };

  // ── START CALL ─────────────────────────────────
  const startCall = async (targetId, type) => {
    if (myStream) myStream.getTracks().forEach((t) => t.stop());
    const constraints = type === "video" ? { video: true, audio: true } : { audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMyStream(stream);
      if (type === "video" && myVideo.current) myVideo.current.srcObject = stream;

      const peer = new Peer({ initiator: true, trickle: false, stream });
      peer.on("signal", (signalData) => {
        socket.emit("callUser", { to: targetId, signalData, from: user._id, name: user.name, callType: type });
      });
      peer.on("stream", (remoteStream) => {
        if (userVideo.current) userVideo.current.srcObject = remoteStream;
      });
      peer.on("error", (err) => console.error("peer error:", err));

      currentPeer.current = peer;
      setCall((c) => ({ ...c, peer, callType: type, isReceivingCall: false }));
      setCallAccepted(false);
      setCallEnded(false);
    } catch (err) {
      showToast("Could not access camera/mic. Check permissions.", "error");
    }
  };

  // ── ANSWER CALL ────────────────────────────────
  const answerCall = async () => {
    if (!call) return;
    const { callType, signal: incomingSignal, from: callerUserId, callId } = call;
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
      });
      peer.on("error", (err) => console.error("peer error:", err));
      peer.signal(incomingSignal);

      currentPeer.current = peer;
      setCallAccepted(true);
      setCall((c) => ({ ...c, peer }));
      setCallEnded(false);
    } catch (err) {
      showToast("Could not access camera/mic. Check permissions.", "error");
    }
  };

  // ── REJECT / END CALL ──────────────────────────
  const rejectCall = () => {
    if (!call) return;
    socket.emit("endCall", { callId: call.callId });
    setCall(null);
  };

  const endCall = () => {
    if (call?.callId) socket.emit("endCall", { callId: call.callId, to: call.from });
    endCallLocal();
  };

  const endCallLocal = () => {
    setCallAccepted(false);
    setCallEnded(true);
    try { currentPeer.current?.destroy?.(); } catch (_) {}
    currentPeer.current = null;
    if (myStream) myStream.getTracks().forEach((t) => t.stop());
    if (userVideo.current?.srcObject) {
      userVideo.current.srcObject.getTracks?.()?.forEach((t) => t.stop());
      userVideo.current.srcObject = null;
    }
    if (myVideo.current) myVideo.current.srcObject = null;
    setMyStream(null);
    setCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    stopRecordingIfNeeded();
  };

  // ── CONTROLS ──────────────────────────────────
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

  // ── RECORDING ─────────────────────────────────
  const startRecording = (remoteStream) => {
    if (isRecording || !remoteStream) return;
    try {
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(remoteStream, { mimeType: "video/webm; codecs=vp9,opus" });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data?.size > 0) recordedChunksRef.current.push(e.data);
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
      showToast("Recording started", "info");
    } catch (_) {
      showToast("Recording not supported in this browser", "error");
    }
  };

  const stopRecordingIfNeeded = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const toggleRecording = () => {
    if (isRecording) { stopRecordingIfNeeded(); return; }
    const remoteStream = userVideo.current?.srcObject;
    if (!remoteStream) { showToast("No remote stream to record yet", "warning"); return; }
    startRecording(remoteStream);
  };

  // ── LOGOUT ────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <ChatLayout
      user={user}
      users={users}
      selectedUser={selectedUser}
      onlineUsers={onlineUsers}
      onSelectUser={(u) => {
        setSelectedUser(u);
        setRoomId(createPrivateRoom(user._id, u._id));
        setMessages([]);
      }}
      messages={messages}
      messagesLoading={messagesLoading}
      message={message}
      onMessageChange={handleMessageChange}
      onSend={handleSend}
      onFileUpload={handleFileUpload}
      typingUser={typingUser}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      call={call}
      callAccepted={callAccepted}
      myStream={myStream}
      myVideo={myVideo}
      userVideo={userVideo}
      isMuted={isMuted}
      isCameraOff={isCameraOff}
      isRecording={isRecording}
      onStartCall={startCall}
      onAnswerCall={answerCall}
      onRejectCall={rejectCall}
      onEndCall={endCall}
      onToggleMute={toggleMute}
      onToggleCamera={toggleCamera}
      onToggleRecording={toggleRecording}
      toast={toast}
      onLogout={handleLogout}
    />
  );
};

export default Chat;
