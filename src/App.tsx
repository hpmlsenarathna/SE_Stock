import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import  Sidebar  from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import  Products  from "./components/Products";
import { Stocks } from "./components/Stocks";
import  Release  from "./components/Releases";
import  ShortExpiry  from "./components/ShortExpiry";
import { Settings } from "./components/Settings";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import ForgotPassword from "./components/ForgotPassword";
import "./styles/daily.css";

const App: React.FC = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const isLoggedIn = token && token !== "null";

  const hideSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <div className="App">
      {!hideSidebar && <Sidebar />}
      <div className="page-container">
<Routes>
  {/* Auth pages */}
  <Route path="/" element={<SignIn />} />
  <Route path="/login" element={<SignIn />} />
  <Route path="/signin" element={<SignIn />} /> {/* <-- Add this line */}
  <Route path="/signup" element={<SignUp />} />

  {/* Protected pages */}
  <Route
    path="/dashboard"
    element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
  />
  <Route
    path="/products"
    element={isLoggedIn ? <Products /> : <Navigate to="/login" />}
  />
  <Route
    path="/stocks"
    element={isLoggedIn ? <Stocks /> : <Navigate to="/login" />}
  />
  <Route
    path="/releases"
    element={isLoggedIn ? <Release /> : <Navigate to="/login" />}
  />
  <Route
    path="/shortexpiry"
    element={isLoggedIn ? <ShortExpiry /> : <Navigate to="/login" />}
  />
  <Route
    path="/settings"
    element={isLoggedIn ? <Settings /> : <Navigate to="/login" />}
  />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Routes>

      </div>
    </div>
  );
};

export default App; // ✅ default export

