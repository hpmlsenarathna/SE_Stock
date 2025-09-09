import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import { Products } from "./components/Products";
import { Stocks } from "./components/Stocks";
import { Release } from "./components/Releases";
import { ShortExpiry } from "./components/ShortExpiry";
import { Users } from "./components/Users";
import { Settings } from "./components/Settings";
import AuthPg from "./components/AuthPg";
import "./styles/daily.css";

const App: React.FC = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // ✅ Decide whether to show sidebar
  const hideSidebar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="App">
      {!hideSidebar && <Sidebar />} {/* Only show Sidebar when logged in */}

      <div className="page-container">
        <Routes>
          {/* Auth pages */}
          <Route path="/login" element={<AuthPg onLogin={() => {}} />} />
          <Route path="/register" element={<Users />} />

          {/* Protected pages */}
          <Route
            path="/"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/products"
            element={token ? <Products /> : <Navigate to="/login" />}
          />
          <Route
            path="/stocks"
            element={token ? <Stocks /> : <Navigate to="/login" />}
          />
          <Route
            path="/releases"
            element={token ? <Release /> : <Navigate to="/login" />}
          />
          <Route
            path="/shortexpiry"
            element={token ? <ShortExpiry /> : <Navigate to="/login" />}
          />
          <Route
            path="/users"
            element={token ? <Users /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={token ? <Settings /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
