import { useState } from "react";
import API from "../services/api";

const Login = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await API.post("/auth/login", formData);

    console.log("✅ LOGIN RESPONSE:", res.data);

    const token = res.data.token;

    // ✅ FIX: Handle BOTH id & _id safely
    const apiUser = res.data.user;

    const user = {
      _id: apiUser._id || apiUser.id,  // ✅ THIS IS THE CRITICAL FIX
      name: apiUser.name,
      email: apiUser.email,
    };

    // ✅ HARD VALIDATION
    if (!token || !user._id || !user.name) {
      console.error("❌ Invalid login response structure:", res.data);
      alert("Login failed due to invalid server response.");
      return;
    }

    // ✅ SAVE PROPERLY
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    console.log("✅ SAVED USER:", JSON.parse(localStorage.getItem("user")));

    alert("Login successful ✅");
    window.location.href = "/chat";
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error.response?.data || error.message);
    alert(error.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="forgot">Forgot password?</div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <p className="link-text">
            No account?{" "}
            <a onClick={onSwitch} style={{ cursor: "pointer" }}>
              Create one
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
