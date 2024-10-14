"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import ChatInput from "@/components/chat/ChatInput"
import ChatMessages from "@/components/chat/ChatMessages"
import ChatSidebar from "@/components/chat/ChatSidebar"
import { ChatHistory, Message } from "@/types"
import { sendMessage } from "@/app/api/chatApi"
import { getClientId, addChatId } from "@/app/utils/storage"
import { v4 as uuidv4 } from 'uuid'

export default function ChatUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null)
  const currentChatRef = useRef<ChatHistory | null>(null)
  const [inputMessage, setInputMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [hints, setHints] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    currentChatRef.current = currentChat
  }, [currentChat])

  useEffect(() => {
    if (currentChat) {
      setChatHistory(prevHistory => {
        const existingChatIndex = prevHistory.findIndex(chat => chat.id === currentChat.id)
        if (existingChatIndex !== -1) {
          const updatedHistory = [...prevHistory]
          updatedHistory[existingChatIndex] = currentChat
          return updatedHistory
        }
        return prevHistory
      })
    }
  }, [currentChat])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const handleSend = async (message: string) => {
    if (message.trim() === "" || isStreaming) return;
  
    const newMessage: Message = {
      id: Math.floor(Math.random() * 1000000),
      content: message,
      sender: "user",
      isSent: false,
    };
  
    const clientId = getClientId();
    let chatId: string;
  
    if (currentChatRef.current) {
      chatId = currentChatRef.current.id.toString();
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
      addChatId(chatId);
    }
  
    setInputMessage("");

    try {
      const { response } = await sendMessage(message, clientId, chatId);
      const aiResponse: Message = {
        id: Math.floor(Math.random() * 1000000),
        content: response,
        sender: "ai",
        isSent: true,
      };

      setCurrentChat((prevChat) => {
        if (!prevChat) return null;
        return {
          ...prevChat,
          messages: [...prevChat.messages, aiResponse],
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };
  

  const startNewChat = () => {
    if (currentChat) {
      setChatHistory(prevHistory => [currentChat, ...prevHistory.filter(chat => chat.id !== currentChat.id)])
    }
    setCurrentChat(null)
    setHints([])
  }

  const deleteChat = (chatId: number) => {
    setChatHistory(prevHistory => prevHistory.filter(chat => chat.id !== chatId))
    if (currentChat && currentChat.id === chatId) {
      setCurrentChat(null)
    }
  }

  const deleteMessage = (messageId: number) => {
    if (currentChat) {
      const updatedMessages = currentChat.messages.filter(message => message.id !== messageId)
      setCurrentChat({ ...currentChat, messages: updatedMessages })
    }
  }

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
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <ChatMessages
          messages={currentChat?.messages || []}
          deleteMessage={deleteMessage}
        />
        {/* <Button
          variant="outline"
          className="bg-primary text-primary-foreground"
          size="sm"
          onClick={startTranscription}
        >
          Start Transcription
        </Button> */}
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
        <Button
          size="icon"
          className='mr-5'
          onClick={toggleSidebar}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
