import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/daily.css";

interface SignUpProps {
  mode?: "update"; // if mode is update, the form pre-fills user data
}

const SignUp: React.FC<SignUpProps> = ({ mode }) => {
  const isUpdate = mode === "update";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    officialId: "",
    fullName: "",
    initials: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  // Prefill data if update mode
  useEffect(() => {
    if (isUpdate) {
      const fetchUser = async () => {
        const userId = localStorage.getItem("token");
        if (userId) {
          const res = await api.get(`/users/${userId}`);
          setFormData({
            officialId: res.data.OfficialID,
            fullName: res.data.FullName,
            initials: res.data.NameWithInitials,
            email: res.data.Email,
            username: res.data.Username,
            password: "",
            confirmPassword: ""
          });
        }
      };
      fetchUser();
    }
  }, [isUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isUpdate) {
        // Update account
        await api.put(`/signup/${localStorage.getItem("token")}`, formData);
        alert("Account updated successfully!");
      } else {
        // Create new account
        await api.post("/signup", formData);
        alert("Account created successfully!");
        navigate("/login");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving account");
    }
  };

  return (
    <div className="form-container">
      <h2>{isUpdate ? "Update Account" : "Create Account"}</h2>
      <form onSubmit={handleSubmit}>
        <input name="officialId" placeholder="Official ID" value={formData.officialId} onChange={handleChange} required />
        <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
        <input name="initials" placeholder="Name with Initials" value={formData.initials} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required={!isUpdate} />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required={!isUpdate} />
        <button type="submit">{isUpdate ? "Update Account" : "Sign Up"}</button>
      </form>
      {!isUpdate && (
        <p>
          Already have an account? <span onClick={() => navigate("/login")}>Sign In</span>
        </p>
      )}
    </div>
  );
};

export default SignUp;
