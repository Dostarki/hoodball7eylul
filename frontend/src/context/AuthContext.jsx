import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi';
import { api, TOKEN_KEY, errMsg } from '../lib/api';
import { robinhood } from '../web3/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // restore session
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .get('/me')
      .then((r) => setUser(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  // wallet switched / disconnected -> drop session that doesn't match
  useEffect(() => {
    if (!user) return;
    if (!isConnected || (address && address.toLowerCase() !== user.address)) logout();
  }, [isConnected, address, user, logout]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address) return;
    setSigning(true);
    setError('');
    try {
      if (chainId !== robinhood.id) {
        try {
          await switchChainAsync({ chainId: robinhood.id });
        } catch (e) {
          // some wallets reject silently; continue, signature does not need the chain
        }
      }
      const { data } = await api.get('/auth/nonce', { params: { address, domain: window.location.host } });
      const signature = await signMessageAsync({ message: data.message });
      const res = await api.post('/auth/verify', { address, message: data.message, signature });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
    } catch (e) {
      setError(errMsg(e, 'Sign-in failed'));
    } finally {
      setSigning(false);
    }
  }, [isConnected, address, chainId, switchChainAsync, signMessageAsync]);

  const setUsername = useCallback(async (username) => {
    const { data } = await api.put('/me/username', { username });
    setUser(data);
    return data;
  }, []);

  const setCharacter = useCallback(async (character_id) => {
    try {
      const { data } = await api.put('/me/character', { character_id });
      setUser(data);
    } catch {
      /* ignore when logged out */
    }
  }, []);

  const fullLogout = useCallback(() => {
    logout();
    disconnect();
  }, [logout, disconnect]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      signing,
      error,
      isConnected,
      address,
      ready: !!user && !!user.username,
      signIn,
      setUsername,
      setCharacter,
      logout: fullLogout,
    }),
    [user, loading, signing, error, isConnected, address, signIn, setUsername, setCharacter, fullLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
