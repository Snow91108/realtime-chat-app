import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import MessageBubble, { MessageSkeleton } from "./MessageBubble";
import MessageInput from "./MessageInput";
import CallModal from "./CallModal";
import Toast from "./Toast";

// Typing indicator animation
const TypingIndicator = ({ name }) => (
  <div className="flex items-end gap-2 animate-fade-up px-1">
    <div className="bg-white dark:bg-surface-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-1.5">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
    <span className="text-xs text-gray-400 mb-1">{name} is typing…</span>
  </div>
);

// Empty state when no chat is selected
const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-gray-50 dark:bg-surface-900">
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-xl shadow-brand-500/30">
      <span className="text-3xl">💬</span>
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
        Welcome to BudPing
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Pick a contact from the sidebar to start a real-time conversation.
      </p>
    </div>
  </div>
);

// Date separator
const DateSeparator = ({ date }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
    <span className="text-[11px] font-medium text-gray-400 bg-gray-50 dark:bg-surface-900 px-2">
      {date}
    </span>
    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
  </div>
);

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
};

const ChatLayout = ({
  // user & contacts
  user,
  users,
  selectedUser,
  onlineUsers,
  onSelectUser,
  // messages
  messages,
  messagesLoading,
  // input
  message,
  onMessageChange,
  onSend,
  onFileUpload,
  // typing
  typingUser,
  // search
  searchQuery,
  onSearchChange,
  // call props
  call,
  callAccepted,
  myStream,
  myVideo,
  userVideo,
  isMuted,
  isCameraOff,
  isRecording,
  onStartCall,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  onToggleRecording,
  // toast
  toast,
  onLogout,
}) => {
  const bottomRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const label = msg.createdAt ? formatDateLabel(msg.createdAt) : "Today";
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
    return groups;
  }, {});

  const showCallModal =
    (call?.isReceivingCall && !callAccepted) ||
    callAccepted ||
    (call && !call.isReceivingCall);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-900 font-sans">
      {/* Sidebar */}
      <Sidebar
        user={user}
        users={users}
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
        onSelectUser={onSelectUser}
        onStartCall={onStartCall}
        onLogout={onLogout}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedUser ? (
          <EmptyState />
        ) : (
          <>
            {/* Sticky chat header */}
            <ChatHeader
              selectedUser={selectedUser}
              onlineUsers={onlineUsers}
              onStartCall={onStartCall}
            />

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1.5 bg-gray-50 dark:bg-surface-900">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              {messagesLoading && <MessageSkeleton />}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <span className="text-3xl">👋</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No messages yet. Say hi to{" "}
                    <strong className="text-gray-700 dark:text-gray-200">
                      {selectedUser?.name}
                    </strong>
                    !
                  </p>
                </div>
              )}

              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-1.5">
                  <DateSeparator date={date} />
                  {msgs.map((m, i) => (
                    <MessageBubble
                      key={m._id || i}
                      message={m}
                      isMine={m.sender === user?.name}
                    />
                  ))}
                </div>
              ))}

              {/* Typing indicator */}
              {typingUser && <TypingIndicator name={typingUser} />}

              <div ref={bottomRef} />
            </div>

            {/* Sticky input bar */}
            <MessageInput
              value={message}
              onChange={onMessageChange}
              onSubmit={onSend}
              onFileUpload={onFileUpload}
              disabled={!selectedUser}
            />
          </>
        )}
      </main>

      {/* Call Modal */}
      {showCallModal && (
        <CallModal
          call={call}
          callAccepted={callAccepted}
          myStream={myStream}
          myVideo={myVideo}
          userVideo={userVideo}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isRecording={isRecording}
          onAnswer={onAnswerCall}
          onReject={onRejectCall}
          onEnd={onEndCall}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleRecording={onToggleRecording}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default ChatLayout;
