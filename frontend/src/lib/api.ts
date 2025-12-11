// frontend/src/lib/api.ts
import axios from "axios";

console.log('API_URL value at runtime:', process.env.NEXT_PUBLIC_API_URL);

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 3000,
});

// Function to fetch CSRF token
let csrfToken: string | null = null;
export const fetchCsrfToken = async () => {
  try {
    const response = await apiClient.get<{ csrfToken: string }>('/api/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

// Request interceptor to include CSRF token for POST requests
apiClient.interceptors.request.use(
  async (config) => {
    if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      if (error.response.status === 403 && error.response.data.error === 'Invalid CSRF token') {
        csrfToken = null;
        throw new Error('Invalid CSRF token. Please try again.');
      }
      if (error.response.status === 404) {
        throw new Error(`Endpoint not found: ${error.config.url}. Check NEXT_PUBLIC_API_URL.`);
      }
      throw new Error(error.response.data.error?.message || `HTTP error! Status: ${error.response.status}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please try again later.');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
);

export async function getClientIP() {
  const res = await apiClient.get("/api/ip");
  return res.data;
}

export async function getWhoisIP(ip: string) {
  const res = await apiClient.get(`/api/whois/${encodeURIComponent(ip)}`);
  return res.data;
}

export async function getWhoisDomain(domain: string) {
  const res = await apiClient.get(`/api/domain-whois?domain=${encodeURIComponent(domain)}`);
  return res.data;
}

export default apiClient;
