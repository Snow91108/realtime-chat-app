import { useEffect, useState } from "react";

const icons = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

const colors = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-brand-500",
  warning: "bg-amber-500",
};

const Toast = ({ message, type = "info" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [message]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-xl animate-fade-up
        ${colors[type] || colors.info}`}
    >
      <span>{icons[type] || icons.info}</span>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
