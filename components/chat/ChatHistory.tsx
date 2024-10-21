"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"
import type { ChatHistory } from "@/app/types"

type Props = {
  chatHistory: ChatHistory[]
  setCurrentChat: (chat: ChatHistory | null) => void
  deleteChat: (chatId: number) => void
}

export default function ChatHistory({ chatHistory, setCurrentChat, deleteChat }: Props) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform ${
        true ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out flex flex-col`}
    >
      <ScrollArea className="flex-grow mt-16">
        {chatHistory.map((chat) => (
          <div key={chat.id} className="flex items-center px-4 py-2 hover:bg-accent group">
            <Button
              variant="ghost"
              className="flex-grow justify-start text-left text-black"
              onClick={() => setCurrentChat(chat)}
            >
              {chat.title}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteChat(chat.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <Button className="w-full" onClick={() => setCurrentChat(null)}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  )
}
