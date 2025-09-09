// components/AuthPg.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface AuthPgProps {
  onLogin: () => void; // 👈 matches App.tsx usage
}

const AuthPg: React.FC<AuthPgProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/users/signin", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token); // save token
      onLogin(); // let App know login worked
      navigate("/dashboard"); // ✅ redirect after login
    } catch (err: any) {
      setError(err.response?.data?.error || "Sign In failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back 👋</h2>
        <p className="subtitle">Please sign in to continue</p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSignIn}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Sign In</button>
        </form>

        <p className="register-text">
          No account yet?{" "}
          <span onClick={() => navigate("/users")}>Create New Account</span>
        </p>
      </div>
    </div>
  );
};

export default AuthPg;
