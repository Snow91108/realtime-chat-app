import { useRef } from "react";
import { EmojiIcon, PaperclipIcon, SendIcon } from "./Icons";

const MessageInput = ({ value, onChange, onSubmit, onFileUpload, disabled }) => {
  const fileRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-2 px-4 py-3 bg-white dark:bg-surface-950 border-t border-gray-100 dark:border-white/5 shrink-0"
    >
      {/* File attachment */}
      <button
        type="button"
        id="file-attach-btn"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        className="btn-icon mb-0.5 shrink-0 hover:text-brand-500"
        title="Attach file"
      >
        <PaperclipIcon className="w-5 h-5" />
      </button>
      <input
        ref={fileRef}
        id="file-input"
        type="file"
        className="hidden"
        onChange={onFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Emoji hint (placeholder — wire up an emoji picker if needed) */}
      <button
        type="button"
        id="emoji-btn"
        disabled={disabled}
        className="btn-icon mb-0.5 shrink-0 hover:text-amber-500"
        title="Emoji"
      >
        <EmojiIcon className="w-5 h-5" />
      </button>

      {/* Text area */}
      <div className="flex-1 relative">
        <textarea
          id="message-input"
          rows={1}
          value={value}
          onChange={onChange}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          disabled={disabled}
          className="w-full resize-none overflow-hidden px-4 py-2.5 rounded-2xl text-sm
                     bg-gray-100 dark:bg-white/5
                     text-gray-800 dark:text-gray-100
                     placeholder-gray-400
                     border border-transparent focus:border-brand-400 focus:bg-white dark:focus:bg-white/8
                     outline-none transition-all duration-200
                     max-h-32 leading-relaxed"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />
      </div>

      {/* Send */}
      <button
        type="submit"
        id="send-btn"
        disabled={disabled || !value?.trim()}
        className="mb-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                   bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white shadow-md shadow-brand-500/30 transition-all duration-200 active:scale-95"
        title="Send"
      >
        <SendIcon className="w-4 h-4" />
      </button>
    </form>
  );
};

export default MessageInput;
