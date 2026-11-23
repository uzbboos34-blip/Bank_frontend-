import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Native Android ilovasi (APK) da to'g'ridan-to'g'ri backend domeniga ulanadi
// Veb brauzerda ham online backendga murojaat qiladi
const BACKEND_URL = 'https://bank-backend-syzt.onrender.com';

const BASE_URL = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_URL || BACKEND_URL)
  : (import.meta.env.VITE_API_URL || BACKEND_URL);

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 soniya timeout (sekin internetda tez qayta urinish uchun)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config._retryCount = config._retryCount || 0;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error?.response?.status;

    // ── Auto-retry: tarmoq uzilishi yoki 5xx server xatosi bo'lsa (Render uyg'onishi uchun) ──
    const isNetworkError = !error.response;
    const isServerError = status >= 500 && status < 600;
    const canRetry = config && (isNetworkError || isServerError) && config._retryCount < MAX_RETRIES;

    if (canRetry) {
      config._retryCount += 1;
      const waitTime = RETRY_DELAY_MS * config._retryCount;
      console.warn(`[AutoRetry] Serverga qayta so'rov (${config._retryCount}/${MAX_RETRIES}) ${waitTime}ms dan keyin...`);
      await delay(waitTime);
      return api(config);
    }

    // ── 401 Unauthorized ──
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const message =
      error?.response?.data?.message ||
      (status === 403
        ? 'Bu amalni bajarishga ruxsatingiz yo\'q'
        : 'Tarmoqda yoki serverda xatolik yuz berdi');
    error.userMessage = Array.isArray(message) ? message.join(', ') : message;
    return Promise.reject(error);
  },
);

export default api;
