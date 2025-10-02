// API configuration for different environments
const isDev = import.meta.env.DEV;

// Get API base URL based on environment
const getApiBaseUrl = () => {
  if (isDev) {
    // Development: use local server
    return 'http://localhost:8080';
  }
  
  // Production: use Netlify Functions (same domain)
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();