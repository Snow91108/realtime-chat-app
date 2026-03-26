const SERVER = "http://localhost:5000";

// Message status SVG ticks
const SingleTick = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const DoubleTick = ({ blue }) => (
  <span className="inline-flex items-center -space-x-2">
    <svg className={`w-3.5 h-3.5 ${blue ? "text-sky-400" : "text-gray-400 dark:text-gray-500"}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
    <svg className={`w-3.5 h-3.5 ${blue ? "text-sky-400" : "text-gray-400 dark:text-gray-500"}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

const StatusIndicator = ({ status }) => {
  if (status === "seen") return <DoubleTick blue />;
  if (status === "delivered") return <DoubleTick />;
  return (
    <SingleTick className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
  );
};

const MessageBubble = ({ message, isMine }) => {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isImage =
    message.fileUrl && message.fileType?.startsWith("image");
  const isFile = message.fileUrl && !isImage;

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-up`}
    >
      <div
        className={`relative group max-w-[72%] sm:max-w-[60%] ${
          isMine
            ? "bg-brand-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-brand-500/20"
            : "bg-white dark:bg-surface-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-white/5"
        }`}
      >
        {/* Image file */}
        {isImage && (
          <a
            href={`${SERVER}${message.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src={`${SERVER}${message.fileUrl}`}
              alt="shared file"
              className="max-w-full max-h-56 object-cover rounded-xl mb-1"
              onError={(e) => (e.target.style.display = "none")}
            />
          </a>
        )}

        {/* Generic file */}
        {isFile && (
          <a
            href={`${SERVER}${message.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 px-3 pt-2.5 text-sm font-medium underline underline-offset-2
              ${isMine ? "text-blue-100 hover:text-white" : "text-brand-600 dark:text-brand-400 hover:text-brand-700"}`}
          >
            <span className="text-base">📎</span>
            <span className="truncate max-w-[160px]">
              {message.fileUrl.split("/").pop()}
            </span>
          </a>
        )}

        {/* Text */}
        {message.text && (
          <p className="px-3.5 pt-2.5 pb-1 text-sm leading-relaxed break-words">
            {message.text}
          </p>
        )}

        {/* Footer: time + status */}
        <div className={`flex items-center gap-1 justify-end px-3 pb-2 ${isImage && !message.text ? "pt-1" : "pt-0"}`}>
          <span className={`text-[10px] ${isMine ? "text-blue-100/70" : "text-gray-400 dark:text-gray-500"}`}>
            {time}
          </span>
          {isMine && <StatusIndicator status={message.status} />}
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for messages
export const MessageSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
        <div
          className={`skeleton h-10 ${i % 2 === 0 ? "w-48" : "w-36"} rounded-2xl`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      </div>
    ))}
  </div>
);

export default MessageBubble;
