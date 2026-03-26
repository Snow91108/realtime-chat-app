import { useEffect, useRef } from "react";

const CallModal = ({
  call,
  callAccepted,
  myStream,
  myVideo,
  userVideo,
  isMuted,
  isCameraOff,
  isRecording,
  onAnswer,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleRecording,
}) => {
  if (!call && !callAccepted) return null;

  const isVideo = call?.callType === "video";
  const isIncoming = call?.isReceivingCall && !callAccepted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden shadow-2xl bg-surface-900 border border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isVideo ? 'bg-brand-600' : 'bg-emerald-600'}`}>
              {isVideo ? "🎥" : "📞"}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {isIncoming
                  ? `Incoming ${isVideo ? "Video" : "Audio"} Call`
                  : callAccepted
                  ? `In Call · ${isVideo ? "Video" : "Audio"}`
                  : `Calling...`}
              </p>
              {call?.name && (
                <p className="text-gray-400 text-xs">{call.name}</p>
              )}
            </div>
          </div>

          {/* Duration / recording badge */}
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium animate-pulse-soft">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              REC
            </span>
          )}
        </div>

        {/* Video area */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center">
          {/* Remote video */}
          <video
            ref={userVideo}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${!callAccepted ? 'opacity-0' : ''}`}
          />

          {/* Placeholder when no remote video yet */}
          {!callAccepted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center text-3xl animate-pulse-soft">
                {call?.name?.[0]?.toUpperCase() || "?"}
              </div>
              {isIncoming ? (
                <p className="text-gray-300 text-sm animate-pulse-soft">
                  {call.name} is calling...
                </p>
              ) : (
                <p className="text-gray-300 text-sm animate-pulse-soft">
                  Ringing...
                </p>
              )}
            </div>
          )}

          {/* Local PiP video */}
          {myStream && isVideo && (
            <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-brand-500 shadow-lg">
              <video
                ref={myVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-6 py-5 bg-surface-950">
          {/* Incoming call: Answer / Reject */}
          {isIncoming && !callAccepted && (
            <>
              <button
                onClick={onAnswer}
                className="flex flex-col items-center gap-1 group"
              >
                <span className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-2xl shadow-lg transition-all duration-200 active:scale-95 animate-ring">
                  📞
                </span>
                <span className="text-xs text-gray-400">Answer</span>
              </button>
              <button
                onClick={onReject}
                className="flex flex-col items-center gap-1 group"
              >
                <span className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-2xl shadow-lg transition-all duration-200 active:scale-95">
                  📵
                </span>
                <span className="text-xs text-gray-400">Decline</span>
              </button>
            </>
          )}

          {/* Active call controls */}
          {callAccepted && (
            <>
              <ControlBtn
                onClick={onToggleMute}
                active={isMuted}
                icon={isMuted ? "🔇" : "🎙️"}
                label={isMuted ? "Unmute" : "Mute"}
              />

              {isVideo && (
                <ControlBtn
                  onClick={onToggleCamera}
                  active={isCameraOff}
                  icon={isCameraOff ? "📷" : "🎥"}
                  label={isCameraOff ? "Cam On" : "Cam Off"}
                />
              )}

              <ControlBtn
                onClick={onToggleRecording}
                active={isRecording}
                icon="⏺️"
                label={isRecording ? "Stop" : "Record"}
                activeClass="bg-red-600 text-white"
              />

              <button
                onClick={onEnd}
                className="flex flex-col items-center gap-1"
              >
                <span className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-2xl shadow-lg transition-all duration-200 active:scale-95">
                  📵
                </span>
                <span className="text-xs text-gray-400">End</span>
              </button>
            </>
          )}

          {/* Outgoing — not yet accepted */}
          {!isIncoming && !callAccepted && (
            <button onClick={onEnd} className="flex flex-col items-center gap-1">
              <span className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-2xl shadow-lg transition-all duration-200 active:scale-95">
                📵
              </span>
              <span className="text-xs text-gray-400">Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ControlBtn = ({ onClick, active, icon, label, activeClass = "bg-white/20 text-white" }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1">
    <span
      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-200 active:scale-95 ${
        active ? activeClass : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {icon}
    </span>
    <span className="text-xs text-gray-400">{label}</span>
  </button>
);

export default CallModal;
