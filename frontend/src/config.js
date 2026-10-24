const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

if (!API_BASE_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL is not set in production!');
}

export default API_BASE_URL;
