import axios from 'axios';

const API_URL = '/api';

export const getPeriods = async () => {
  const response = await axios.get(`${API_URL}/reports/periods`);
  return response.data;
};

export const generateReport = async (period: string, oficioNumber: string) => {
  const response = await axios.post(
    `${API_URL}/reports/generate`,
    { period, oficioNumber },
    { responseType: 'blob' }
  );
  return response.data;
};