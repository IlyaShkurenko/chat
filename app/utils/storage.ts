import { v4 as uuidv4 } from 'uuid';
import { ChatHistory } from '@/types';

export const getClientId = (): string => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = uuidv4();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
};

export const saveChatData = (chat: ChatHistory): void => {
  const chats = getChatData();
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  if (existingIndex !== -1) {
    chats[existingIndex] = chat;
  } else {
    chats.unshift(chat);
  }
  localStorage.setItem('chats', JSON.stringify(chats));
};

export const getChatData = (): ChatHistory[] => {
  const chats = localStorage.getItem('chats');
  return chats ? JSON.parse(chats) : [];
};

export const deleteChatData = (chatId: string): void => {
  const chats = getChatData().filter(chat => chat.id !== chatId);
  localStorage.setItem('chats', JSON.stringify(chats));
};
