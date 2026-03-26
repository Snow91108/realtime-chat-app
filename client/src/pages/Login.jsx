import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("budping-theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", formData);
      const apiUser = res.data.user;
      const token = res.data.token;
      const user = { _id: apiUser._id || apiUser.id, name: apiUser.name, email: apiUser.email };
      if (!token || !user._id) { setError("Invalid server response"); return; }
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 px-4 transition-colors duration-300">
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to <span className="font-semibold text-brand-600 dark:text-brand-400">BudPing</span>
          </p>
        </div>

        {/* Form card */}
        <div className="glass rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                           text-gray-900 dark:text-white placeholder-gray-400
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
                           transition-all duration-200 text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                           text-gray-900 dark:text-white placeholder-gray-400
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
                           transition-all duration-200 text-sm"
              />
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500
                         text-white font-semibold text-sm shadow-lg shadow-brand-500/30
                         transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              id="go-register"
              onClick={() => navigate("/register")}
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Create one
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} BudPing · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default Login;
