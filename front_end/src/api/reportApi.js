import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`;

const reportApi = {
  createReport: async (roomId, data) => {
    const response = await axios.post(`${API_URL}/${roomId}`, data);
    return response.data;
  }
};

export default reportApi;
