import axios from 'axios';

// Instancia de axios con baseURL
const API = axios.create({
  baseURL: '/api'  // Vite redirige esto al backend (local o Render)
});

export const getPeriods = async () => {
  const response = await API.get('/reports/periods');  // ← con "o"
  return response.data;
};

export const generateReport = async (period: string, oficioNumber: string) => {
  const response = await API.post(
    '/reports/generate',
    { period, oficioNumber },
    { responseType: 'blob' }
  );
  return response.data;
};