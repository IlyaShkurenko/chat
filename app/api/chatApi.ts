import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const sendMessage = async (message: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-message`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
