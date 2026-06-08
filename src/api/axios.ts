import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const api = axios.create();

// Request Interceptor: Dynamic host injection and API credential association
api.interceptors.request.use(
  (config) => {
    const { serverUrl, apiKey } = useAppStore.getState();

    // Clean up trailing slash and bind baseline configuration
    let normalizedUrl = serverUrl.trim().replace(/\/+$/, '');

    // Ensure protocol is present and it's not a relative path
    if (normalizedUrl && !normalizedUrl.startsWith('/') && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    config.baseURL = normalizedUrl;

    // Attach SmashCore API key ONLY for non-GET requests to prevent CORS preflight OPTIONS
    // requests on simple GET endpoints (like /api/web/devices) which the C++ backend does not support.
    if (apiKey && config.method && config.method.toUpperCase() !== 'GET') {
      config.headers['X-API-Key'] = apiKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global interception and user notice translation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { addToast } = useAppStore.getState();
    let errorMsg = 'Ошибка соединения с бэкендом SmashCore';

    if (error.response) {
      const status = error.response.status;
      const serverDetails = error.response.data?.message || '';

      if (status === 401 || status === 403) {
        errorMsg = 'Неверный API-ключ или доступ заблокирован';
      } else if (status === 404) {
        errorMsg = `Ресурс не найден (404): ${errorMsg}`;
      } else {
        errorMsg = `Ошибка сервера (${status}): ${serverDetails || 'Внутренняя неисправность'}`;
      }
    } else if (error.request) {
      // No response received (Timeout or CORS restriction or socket down)
      errorMsg = 'Ошибка соединения: Нет ответа от SmashCore сервера. Проверьте URL сети!';
    } else {
      errorMsg = `Критическая ошибка: ${error.message}`;
    }

    // Fire the automatic self-cleaning toast in russian
    addToast(errorMsg, 'error');

    return Promise.reject(error);
  }
);

export default api;
