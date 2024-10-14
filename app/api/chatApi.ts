import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const sendMessage = async (message: string, clientId: string, chatId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/message`, { message, clientId, chatId });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getChatHistory = async (clientId: string, chatId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/history`, {
      params: { clientId, chatId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};
