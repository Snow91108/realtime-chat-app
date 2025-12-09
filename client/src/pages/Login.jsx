import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const navigate = useNavigate();

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
    setLoading(true);

    try {
      const res = await API.post("/auth/login", formData);

      const apiUser = res.data.user;
      const token = res.data.token;

      const user = {
        _id: apiUser._id || apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
      };

      if (!token || !user._id) {
        alert("Invalid server response");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Login successful!");
      navigate("/chat");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
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
            <a style={{ cursor: "pointer" }} onClick={() => navigate("/register")}>
              Create one
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
