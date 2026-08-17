import axios from "axios";

/**
 * Pre-configured Axios instance.
 * baseURL points to the Vite dev proxy (/api) which forwards to Express.
 * In production, set VITE_API_URL to the actual API origin.
 * withCredentials enables httpOnly cookie transmission for authentication.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
