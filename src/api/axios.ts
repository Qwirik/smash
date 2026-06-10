import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const api = axios.create();

// Request Interceptor: Dynamic host injection and API credential association
api.interceptors.request.use(
  (config) => {
    const { serverUrl, apiKey } = useAppStore.getState();

    // Ensure the URL has a protocol and ends with a slash for relative path resolution
    let normalizedUrl = serverUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'http://' + normalizedUrl;
    }
    if (!normalizedUrl.endsWith('/')) {
      normalizedUrl += '/';
    }
    config.baseURL = normalizedUrl;

    // Attach SmashCore API key
    if (apiKey) {
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
  (response) => {
    // Detect if the server incorrectly returned HTML instead of JSON
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      const errorMsg = 'Сервер вернул HTML-страницу вместо JSON. Проверьте правильность порта бэкенда (например, :8080 вместо :3000)';
      useAppStore.getState().addToast(errorMsg, 'error');
      // Replace data to prevent frontend crashes downstream
      response.data = [];
      return Promise.reject(new Error(errorMsg));
    }
    return response;
  },
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
