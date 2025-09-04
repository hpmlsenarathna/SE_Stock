import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Drawer,
  ListItemButton,
  Box,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Stocks", path: "/stocks" },
    { name: "Releases", path: "/releases" },
    { name: "ShortExpiry", path: "/shortexpiry" },
    { name: "Users", path: "/users" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 220,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 220,
          boxSizing: "border-box",
          backgroundColor: "#2e3b4e",
          color: "white",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          overflowX: "hidden",
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 120,
          mt: 2,
          mb: 3,
        }}
      >
        <img
          src="/logo.png"
          alt="System Logo"
          style={{
            width: 100,
            height: "auto",
            borderRadius: 10,
          }}
        />
      </Box>

      {/* Menu Items */}
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.name} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  color: isActive ? "#ffd700" : "white",
                  fontSize: "1.2rem",
                  paddingY: 1.5,
                  px: 2,
                  "&:hover": { backgroundColor: "#1c2533" },
                  transition: "all 0.3s",
                }}
              >
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontFamily:
                      "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    fontSize: "1.2rem",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};
