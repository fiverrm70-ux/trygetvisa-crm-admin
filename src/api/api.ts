import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'https://trygetvisa-crm-api.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('try_get_visa_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
