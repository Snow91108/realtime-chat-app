import { PhoneIcon, VideoIcon } from "./Icons";
import { getInitials, getAvatarColor } from "./Sidebar";

const ChatHeader = ({ selectedUser, onlineUsers, onStartCall }) => {
  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <header className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-surface-950 border-b border-gray-100 dark:border-white/5 shrink-0 shadow-sm">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(selectedUser._id)} flex items-center justify-center text-white text-sm font-bold shadow`}>
          {getInitials(selectedUser.name)}
        </div>
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-950 ${isOnline ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-600"}`} />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {selectedUser.name}
        </h2>
        <p className={`text-xs font-medium ${isOnline ? "text-emerald-500" : "text-gray-400"}`}>
          {isOnline ? "● Active now" : "○ Offline"}
        </p>
      </div>

      {/* Call buttons */}
      <div className="flex items-center gap-1">
        <button
          id="header-audio-call"
          onClick={() => onStartCall(selectedUser._id, "audio")}
          className="btn-icon hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400"
          title="Audio call"
        >
          <PhoneIcon className="w-4.5 h-4.5" />
        </button>
        <button
          id="header-video-call"
          onClick={() => onStartCall(selectedUser._id, "video")}
          className="btn-icon hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400"
          title="Video call"
        >
          <VideoIcon className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
