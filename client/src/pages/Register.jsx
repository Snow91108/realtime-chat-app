import { useState } from "react";
import API from "../services/api";

const Register = ({ onSwitch }) => {
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
      const res = await API.post("/auth/register", formData);

      alert("Registration successful ✅ Now login");
      console.log("Registered User:", res.data);

      // ✅ Switch to Login after successful register
      onSwitch();

    } catch (error) {
      console.error(error.response?.data?.message);
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
            <a onClick={onSwitch} style={{ cursor: "pointer" }}>
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
