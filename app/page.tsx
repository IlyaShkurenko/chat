"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { ChatHistory, Message, PostData } from "@/app/types";
import { getClientId, saveChatData, getChatData, deleteChatData } from "@/app/utils/storage";
import { v4 as uuidv4 } from "uuid";
import SocialMediaPost from '@/components/chat/SocialMediaPost';

export default function ChatUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null);
  const currentChatRef = useRef<ChatHistory | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    if (!socketRef.current) {
      const clientId = getClientId();
      socketRef.current = new WebSocket(`ws://localhost:8000/ws/${clientId}`);

      socketRef.current.onopen = () => {
        console.log("Connected to WebSocket");
      };

      socketRef.current.onclose = () => {
        console.log("Disconnected from WebSocket");
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "history") {
          setCurrentChat((prevChat) => {
            if (!prevChat) return null;
            if(prevChat.messages.length === 0) {
              const updatedMessages = data.content.map((message: Message | any) => {
                if (typeof message.content === 'object' && message.content !== null) {
                  return {
                    id: Math.floor(Math.random() * 1000000),
                    post: { ...message.content },
                    message: message.message, 
                  };
                }
                return {
                  ...message,
                  id: Math.floor(Math.random() * 1000000) // Убрана лишняя закрывающая скобка
                };
              });
              const updatedChat = {
                ...prevChat,
                messages: updatedMessages
              };
              saveChatData(updatedChat);
              return updatedChat;
            }
            return prevChat;
          });
        } else if (data.type === "message") {
          handleReceivedMessage(data.content);
        } else if (data.type === "planning_started") {
          setIsPlanning(true);
        } else if (data.type === "execution_started") {
          setIsPlanning(false);
          setIsExecuting(true);
        } else if (data.type === "redirecting") {
          setIsExecuting(false);
          setIsRedirecting(true);
        } else if (data.type === "planning_ended") {
          // setIsPlanning(false);
        } else if (data.type === "error") {
          // console.log('error')
          alert(data.content);
        }
      };
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadedChatHistory = getChatData();
    if (loadedChatHistory.length > 0) {
      const lastChat = loadedChatHistory[loadedChatHistory.length - 1];
      setChatHistory(
        loadedChatHistory.map(({ id, title }) => ({ id, title, messages: [] }))
      );
      setCurrentChat({ id: lastChat.id, title: lastChat.title, messages: [] });
    }
  }, []);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    if (currentChat) {
      setChatHistory((prevHistory) => {
        const existingChatIndex = prevHistory.findIndex(
          (chat) => chat.id === currentChat.id
        );
        if (existingChatIndex !== -1) {
          const updatedHistory = [...prevHistory];
          updatedHistory[existingChatIndex] = currentChat;
          return updatedHistory;
        }
        return prevHistory;
      });
      saveChatData(currentChat);
    }
  }, [currentChat]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSend = async (message: string) => {
    if (message.trim() === "" || isStreaming) return;

    const newMessage: Message = {
      id: Math.floor(Math.random() * 1000000),
      content: message,
      sender: "user",
      isSent: false,
    };

    // const clientId = getClientId();
    let chatId: string;

    if (currentChatRef.current) {
      chatId = currentChatRef.current.id;
      setCurrentChat((prevChat) => {
        if (!prevChat) return null;

        const updatedChat = {
          ...prevChat,
          messages: [...prevChat.messages, newMessage],
        };

        return updatedChat;
      });
    } else {
      chatId = uuidv4();
      const newChat: ChatHistory = {
        id: chatId,
        title: `New Chat ${chatHistory.length + 1}`,
        messages: [newMessage],
      };

      setChatHistory((prevHistory) => [newChat, ...prevHistory]);
      setCurrentChat(newChat);
    }

    setInputMessage("");

    if (socketRef.current ) {
      setIsStreaming(true)
      socketRef.current.send(
        JSON.stringify({
          type: "message",
          content: message,
          chatId,
        })
      );
    }
  };

  useEffect(() => {
    const loadChatHistory = () => {
      if (currentChat && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "get_history",
            content: currentChat.messages,
            chatId: currentChat.id,
          })
        );
      }
    };
  
    if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
      const handleOpen = () => {
        loadChatHistory();
      };
  
      socketRef.current.addEventListener('open', handleOpen);
  
      return () => {
        if (socketRef.current) {
          socketRef.current.removeEventListener('open', handleOpen);
        }
      };
    } else {
      loadChatHistory();
    }
  }, [currentChat?.id]);
  
  const handleReceivedMessage = (messageContent: any) => {
    if (!isPlanning) {
      console.log('stop streaming');
      setIsStreaming(false);
      setIsPlanning(false);
      setIsExecuting(false);
      setIsRedirecting(false);
    }
  
    const addMessageToChat = (content: string | PostData) => {
      setCurrentChat((prevChat) => {
        if (!prevChat) return null;
        let messageContent = ''
        let post;
        if (typeof content === 'object') {
          if (content.message) messageContent = content.message;
          post = content;
        }  else {
          messageContent = content;
        }
        const aiMessage: Message = {
          id: Math.floor(Math.random() * 1000000),
          content: messageContent,
          post,
          sender: "ai",
          isSent: true,
        };
        return { ...prevChat, messages: [...prevChat.messages, aiMessage] };
      });
    };
    addMessageToChat(messageContent);
  };  

  const startNewChat = () => {
    if (currentChat) {
      setChatHistory((prevHistory) => [
        currentChat,
        ...prevHistory.filter((chat) => chat.id !== currentChat.id),
      ]);
    }
    setCurrentChat(null);
    setHints([]);
  };

  const deleteChat = (chatId: string) => {
    setChatHistory((prevHistory) =>
      prevHistory.filter((chat) => chat.id !== chatId)
    );
    if (currentChat && currentChat.id === chatId) {
      setCurrentChat(null);
    }
    deleteChatData(chatId);
  };

  const deleteMessage = (messageId: number) => {
    if (currentChat) {
      if(socketRef.current) {
        const message = currentChat.messages.find(message => message.id === messageId)?.content;
        socketRef.current.send(
          JSON.stringify({
            type: "delete_message",
            content: message,
            chatId: currentChat.id,
          })
        );
      }
      const updatedMessages = currentChat.messages.filter(
        (message) => message.id !== messageId
      );
      setCurrentChat({ ...currentChat, messages: updatedMessages });
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
        chatHistory={chatHistory}
        setCurrentChat={setCurrentChat}
        deleteChat={deleteChat}
      />
      <div
        className={`flex-1 flex flex-col ${
          sidebarOpen ? "ml-64" : "ml-0"
        } transition-all duration-300`}
      >
        <ChatMessages
          messages={currentChat?.messages || []}
          isThinking={isStreaming}
          isPlanning={isPlanning}
          isExecuting={isExecuting}
          isRedirecting={isRedirecting}
          deleteMessage={deleteMessage}
        />
        {hints.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-t justify-center">
            {hints.map((hint, index) => (
              <Button
                key={index}
                variant="outline"
                className="bg-primary text-primary-foreground"
                size="sm"
                onClick={() => handleSend(hint)}
              >
                {hint}
              </Button>
            ))}
          </div>
        )}
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSend={handleSend}
          isStreaming={isStreaming}
        />
      </div>
      <div className="fixed top-4 left-4 z-50 flex items-center space-x-2">
        <Button size="icon" className="mr-5" onClick={toggleSidebar}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}