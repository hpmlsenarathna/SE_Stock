// theme.tsx
import React, { createContext, useState, useMemo, ReactNode } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

interface ThemeContextType {
  toggleTheme: () => void;
  mode: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  mode: "light",
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark">("light");

  const toggleTheme = () => setMode(prev => (prev === "light" ? "dark" : "light"));

  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        ...(mode === "light"
          ? {
              background: { default: "#f5f5f5" },
              text: { primary: "#222" },
            }
          : {
              background: { default: "#1b263b" },
              text: { primary: "#e0e0e0" },
            }),
      },
    }), 
  [mode]);

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
