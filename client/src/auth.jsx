import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('session'));
    } catch {
      return null;
    }
  });

  function login(newSession) {
    localStorage.setItem('session', JSON.stringify(newSession));
    setSession(newSession);
  }

  function logout() {
    localStorage.removeItem('session');
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, token: session?.token ?? null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
