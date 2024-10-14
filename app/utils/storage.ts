import { v4 as uuidv4 } from 'uuid';

export const getClientId = (): string => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = uuidv4();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
};

export const getChatIds = (): string[] => {
  const chatIds = localStorage.getItem('chatIds');
  return chatIds ? JSON.parse(chatIds) : [];
};

export const addChatId = (chatId: string): void => {
  const chatIds = getChatIds();
  chatIds.push(chatId);
  localStorage.setItem('chatIds', JSON.stringify(chatIds));
};
