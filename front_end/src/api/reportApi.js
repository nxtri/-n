import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reports';

const reportApi = {
  createReport: async (roomId, data) => {
    const response = await axios.post(`${API_URL}/${roomId}`, data);
    return response.data;
  }
};

export default reportApi;
