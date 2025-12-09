import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", formData);

      alert("Registration successful! Please login.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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

          <button className="auth-btn" type="submit">
            SIGN UP
          </button>

          <p className="link-text">
            Already have an account?{" "}
            <a style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
