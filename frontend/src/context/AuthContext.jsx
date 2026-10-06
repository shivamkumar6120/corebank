import { useEffect, useState } from "react";
import { createContext, useContext } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("corebank_token");
    if (!token) {
      setReady(true);
      return;
    }
    api.get("/profile")
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem("corebank_token");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const establish = (token, profile) => {
    localStorage.setItem("corebank_token", token);
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem("corebank_token");
    setUser(null);
    sessionStorage.setItem("corebank_signed_out", "1");
  };

  return (
    <AuthContext.Provider value={{ user, ready, establish, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
