import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "klasik", label: "Klasik", swatch: ["#FAFAF6", "#1F7A5C"] },
  { id: "gelap", label: "Gelap", swatch: ["#14181A", "#3FBE8B"] },
  { id: "cerah", label: "Cerah", swatch: ["#F5F7FA", "#2563EB"] },
  { id: "pink", label: "Pink Lembut", swatch: ["#FDF3F6", "#D46A8C"] },
  { id: "bluejeans", label: "Blue Jeans", swatch: ["#EEF3F7", "#2E6E9E"] },
  { id: "pinkjeans", label: "Pink Denim", swatch: ["#F6F0F5", "#81749E"] },
];

const ThemeContext = createContext(null);
const STORAGE_KEY = "ledger-theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("klasik");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setTheme = (id) => {
    setThemeState(id);
    document.documentElement.setAttribute("data-theme", id);
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
