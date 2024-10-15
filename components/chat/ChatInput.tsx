"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

type Props = {
  inputMessage: string
  setInputMessage: (message: string) => void
  handleSend: (message: string) => void
  isStreaming: boolean
}

export default function ChatInput({ inputMessage, setInputMessage, handleSend, isStreaming }: Props) {
  return (
    <div className="p-4 border-t">
      <div className="relative">
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleSend(inputMessage);
            }
          }}
          placeholder="Type your message here..."
          className="pr-24 resize-none text-black"
          rows={3}
        />
        <div className="absolute right-2 bottom-2 flex">
          {/* <Button
            size="icon"
            onClick={combineMessages}
            className="mr-2"
            title="Combine Assistant Messages"
          >
            <Combine className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => handleSend(inputMessage)}
            disabled={isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button> */}
          <Button
            size="icon"
            onClick={() => handleSend(inputMessage)}
            disabled={isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
