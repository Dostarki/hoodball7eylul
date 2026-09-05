import axios from 'axios';

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const EARLY_TOKEN = 'futbot.early';
export const ADMIN_TOKEN = 'futbot.admin';

const withToken = (key) => {
  const inst = axios.create({ baseURL: BASE });
  inst.interceptors.request.use((cfg) => {
    const t = localStorage.getItem(key);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  return inst;
};

export const earlyApi = withToken(EARLY_TOKEN);
export const adminApi = withToken(ADMIN_TOKEN);

export const tweetIntent = (text, url) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ''}`;

export const padTicket = (n) => `#${String(n).padStart(4, '0')}`;
