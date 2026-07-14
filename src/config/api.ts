// Central API base URL config
// In development: http://localhost:8000
// In production (Vercel): same domain, just /api prefix
export const API_BASE = import.meta.env.VITE_API_URL || '';
