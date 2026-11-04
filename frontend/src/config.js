// Backend address comes only from VITE_API_URL (Cloudflare build settings in production).
// Trailing slashes are trimmed so paths like `${API_BASE_URL}/api/...` never get a double slash.
const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');

if (!API_BASE_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL is not set in production!');
}

export default API_BASE_URL;
