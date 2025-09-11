import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/daily.css";

const SignIn: React.FC = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    // Logged-in users stay on Sign In page, no redirect
    const loggedIn = localStorage.getItem("userLoggedIn");
    if (loggedIn) {
      console.log("Already logged in, but can access Sign In page.");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/signin", formData);
      alert(res.data.message);

      // Store auth state
      localStorage.setItem("token", res.data.userId);
      localStorage.setItem("userLoggedIn", "true");

      navigate("/dashboard"); // Navigate only after successful login
    } catch (err: any) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="form-container">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Sign In</button>
      </form>

      <p>
        <span
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </span>
      </p>

      <p>
        Don't have an account?{" "}
        <span
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
};

export default SignIn;
