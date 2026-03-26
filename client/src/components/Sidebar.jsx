import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import {
  SearchIcon, PhoneIcon, VideoIcon, LogoutIcon, MenuIcon, XIcon,
} from "./Icons";

// Derive avatar initials + deterministic color
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
  "from-pink-500 to-fuchsia-500",
];

const getAvatarColor = (id = "") =>
  avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const Sidebar = ({
  user,
  users,
  selectedUser,
  onlineUsers,
  onSelectUser,
  onStartCall,
  onLogout,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = users.filter(
    (u) =>
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white tracking-tight text-lg">
            BudPing
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Mobile close */}
          <button
            className="md:hidden btn-icon"
            onClick={() => setMobileOpen(false)}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* My profile strip */}
      {user && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user._id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow`}>
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-emerald-500 font-medium">● Online</p>
          </div>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="ml-auto btn-icon hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400"
            title="Logout"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/8 dark:bg-opacity-8 border border-transparent focus-within:border-brand-400 transition-colors">
          <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            id="user-search"
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Section label */}
      <p className="px-5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Contacts · {filtered.length}
      </p>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
            <span className="text-2xl">🔍</span>
            <p className="text-sm">No users found</p>
          </div>
        )}

        {filtered.map((u) => {
          const isOnline = onlineUsers.includes(u._id);
          const isSelected = selectedUser?._id === u._id;

          return (
            <div
              key={u._id}
              id={`user-${u._id}`}
              onClick={() => {
                onSelectUser(u);
                setMobileOpen(false);
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 animate-slide-in
                ${isSelected
                  ? "bg-brand-500 shadow-md shadow-brand-500/20"
                  : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u._id)} flex items-center justify-center text-white text-xs font-bold shadow`}>
                  {getInitials(u.name)}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-950 transition-colors
                    ${isOnline ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-600"}`}
                />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>
                  {u.name}
                </p>
                <p className={`text-xs truncate ${isSelected ? "text-blue-100" : isOnline ? "text-emerald-500" : "text-gray-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              {/* Call quick-actions (hover) */}
              <div className={`flex items-center gap-1 transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <button
                  id={`audio-call-${u._id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(u._id, "audio");
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"}`}
                  title="Audio call"
                >
                  <PhoneIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`video-call-${u._id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(u._id, "video");
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"}`}
                  title="Video call"
                >
                  <VideoIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 btn-icon bg-white dark:bg-surface-800 shadow-lg border border-gray-200 dark:border-white/10"
        onClick={() => setMobileOpen(true)}
        id="sidebar-open-btn"
      >
        <MenuIcon className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-72 md:w-72 flex-shrink-0
          flex flex-col
          bg-white dark:bg-surface-950
          border-r border-gray-100 dark:border-white/5
          shadow-xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export { getInitials, getAvatarColor };
export default Sidebar;
