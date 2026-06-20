import { create } from 'zustand';
import api, { setAccessToken } from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      if (parsed && parsed.role === 'patient') {
        parsed.role = 'seeker';
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (_) {
      localStorage.removeItem('user');
      return null;
    }
  })(),
  oneblood_token: null, // access token stored in memory only
  isAuthenticated: false,
  isLoading: true, // starts loading to check silent session
  isInitialized: false,
  error: null,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // Silent refresh — cookie sent automatically by browser
      const refreshRes = await api.post('/auth/refresh');
      const { accessToken } = refreshRes.data;
      setAccessToken(accessToken);

      const res = await api.get('/auth/me');
      const { user } = res.data;
      if (user && user.role === 'patient') user.role = 'seeker';
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, oneblood_token: accessToken, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (err) {
      setAccessToken(null);
      localStorage.removeItem('user');
      set({ user: null, oneblood_token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },

  login: async (onebloodId, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { onebloodId, email, password });
      const { accessToken, user } = res.data;

      if (user && user.role === 'patient') user.role = 'seeker';
      setAccessToken(accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        oneblood_token: accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  register: async (name, email, phone, password, role, city, extraData = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, phone, password, role, city, ...extraData });
      const { accessToken, user } = res.data;

      if (user && user.role === 'patient') user.role = 'seeker';
      setAccessToken(accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        oneblood_token: accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err.message);
    }
    setAccessToken(null);
    localStorage.removeItem('user');
    set({
      user: null,
      oneblood_token: null,
      isAuthenticated: false,
      error: null
    });
  },

  switchRole: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/switch-role');
      const { accessToken, user } = res.data;

      if (user && user.role === 'patient') user.role = 'seeker';
      setAccessToken(accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        oneblood_token: accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to switch role';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      const { user } = res.data;
      if (user && user.role === 'patient') user.role = 'seeker';
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return user;
    } catch (err) {
      get().logout();
    }
  },

  registerDonorProfile: async (donorData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/donors/register', donorData);
      const { donor } = res.data;
      
      const updatedUser = { ...get().user, role: 'donor', profileId: donor._id, donorProfileComplete: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({
        user: updatedUser,
        isLoading: false
      });
      return donor;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to register donor profile';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  registerBankProfile: async (bankData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/banks/register', bankData);
      const { bank } = res.data;

      const updatedUser = { ...get().user, role: 'blood_bank', profileId: bank._id, bankProfileComplete: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        isLoading: false
      });
      return bank;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to register blood bank profile';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  }
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    useAuthStore.getState().logout();
  });
  window.addEventListener('auth-token-refresh', (e) => {
    useAuthStore.setState({ oneblood_token: e.detail, isAuthenticated: true });
  });
}

export default useAuthStore;
