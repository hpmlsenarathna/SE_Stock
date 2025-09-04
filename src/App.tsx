import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Products } from './components/Products';
import { Stocks } from './components/Stocks';
import { Release } from './components/Releases';
import { ShortExpiry } from './components/ShortExpiry';
import { Users } from './components/Users';
import { Settings } from './components/Settings';
// in App.tsx
import "./styles/daily.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <Sidebar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/releases" element={<Release />} />
          <Route path="/shortexpiry" element={<ShortExpiry />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
