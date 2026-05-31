import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending/receiving cookies
});

// Interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // When sending FormData, delete the default Content-Type so the browser
    // can set multipart/form-data with the correct boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the unauthorized request is already refresh or logout
      const isAuthRequest = originalRequest.url && (
        originalRequest.url.includes('/auth/refresh') || 
        originalRequest.url.includes('/auth/logout')
      );
      
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        // Call auth refresh endpoint (cookie is automatically sent, body sent as localStorage fallback)
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: storedRefreshToken }, { withCredentials: true });
        const { accessToken: newAccessToken } = res.data;

        setAccessToken(newAccessToken);
        window.dispatchEvent(new CustomEvent('auth-token-refresh', { detail: newAccessToken }));

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear token and trigger logout
        setAccessToken(null);
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const ASSETS_URL = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default api;
export { API_URL, ASSETS_URL };
