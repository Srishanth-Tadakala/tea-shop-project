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
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Ensure path starts with /api
  if (!normalizedPath.startsWith('/api')) {
    normalizedPath = '/api' + (normalizedPath.startsWith('/') ? '' : '/') + normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};
