// Centralized axios instance for real APIs
// Re-use the existing configuration (base URL, interceptors, mock toggle)
// Configure REACT_APP_API_BASE_URL in your .env to point to the backend.
import api from './utils/api';
export default api;


