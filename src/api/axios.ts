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

    // Construct a highly detailed error message for debugging
    let detailedMsg = `[AXIOS ERROR] ${error.message}\n`;

    if (error.config && error.config.url) {
      detailedMsg += `URL: ${error.config.baseURL || ''}${error.config.url}\n`;
      detailedMsg += `Method: ${error.config.method?.toUpperCase()}\n`;
    }

    if (error.response) {
      detailedMsg += `Status: ${error.response.status} ${error.response.statusText}\n`;
      const dataStr = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data).substring(0, 100);
      detailedMsg += `Data: ${dataStr}\n`;
    } else if (error.request) {
      detailedMsg += 'No response received from server (Possible CORS issue or server down).\n';
    }

    // Output to console for easy copying by developer
    console.error("=== DETAILED API ERROR ===");
    console.error(detailedMsg);
    console.error(error);
    console.error("==========================");

    // Fire the toast with full details
    addToast(detailedMsg, 'error');

    return Promise.reject(error);
  }
);

export default api;
