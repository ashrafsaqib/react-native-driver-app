// src/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { driverApi } from '../api/driverApi';

type User = { id: number };
const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}>(null as any);

const TOKEN_KEY = '@driverApp:token';
const USER_ID_KEY = '@driverApp:userId';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // 1️⃣  Hydrate token/user_id on start-up
  useEffect(() => {
    (async () => {
      try {
        const [t, uid] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_ID_KEY),
        ]);
        if (t && uid) {
          setToken(t);
          setUser({ id: Number(uid) });
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

const login = async (username: string, password: string) => {
  const res = await driverApi.login({ username, password });

  // Guard against bad response
  if (!res.access_token || !res.user?.id) {
    throw new Error('Invalid server response');
  }

  const newToken = res.access_token;
  const newUserId = String(res.user.id);

  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, newToken),
    AsyncStorage.setItem(USER_ID_KEY, newUserId),
  ]);

  setToken(newToken);
  setUser(res.user);
};

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
    ]);
    setToken(null);
    setUser(null);
  };

  // show nothing until hydration is done (avoids flicker)
  if (!hydrated) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);