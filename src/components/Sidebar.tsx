import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';


const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem('userLoggedIn');

  const menuItems = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true, icon: <DashboardIcon /> },
    { name: 'Products', path: '/products', icon: <InventoryIcon /> },
    { name: 'Stocks', path: '/stocks', icon: <ShoppingCartIcon /> },
    { name: 'Releases', path: '/releases', icon: <CloudUploadIcon /> },
    { name: 'Short Expiry', path: '/shortexpiry', icon: <AccessAlarmIcon /> },
  ], []);

  const extraButtons = useMemo(() => [
    { name: 'Sign In', path: '/signin', icon: <LoginIcon /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ], []);

  const renderListItem = (item) => {
    const isActive = location.pathname === item.path;

    const handleClick = (e) => {
      if (item.requiresAuth && !loggedIn) {
        e.preventDefault();
        navigate('/signin');
      }
    };

    return (
      <div key={item.name} className={`sidebar-item ${isActive ? 'active' : ''}`}>
        <Link to={item.path} onClick={handleClick}>
          <div className="sidebar-icon">{item.icon}</div>
          <span>{item.name}</span>
        </Link>
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Logo" />
        <h2>My System</h2>
      </div>

      <div className="sidebar-list">
        {menuItems.map(renderListItem)}
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-list">
        {extraButtons.map(renderListItem)}
      </div>
    </div>
  );
};

export default Sidebar;
