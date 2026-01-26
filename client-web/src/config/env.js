const getRequiredEnv = (key) => {
  const value = import.meta.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return String(value).trim().replace(/\/$/, '');
};

export const API_BASE_URL = getRequiredEnv('VITE_API_URL');
export const WS_URL = getRequiredEnv('VITE_WS_URL');

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
