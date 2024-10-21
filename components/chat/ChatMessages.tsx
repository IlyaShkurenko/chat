import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef } from 'react';
import SocialMediaPost from './SocialMediaPost';

type Props = {
  messages: Message[];
  isThinking: boolean;
  isPlanning: boolean;
  isExecuting: boolean;
  isRedirecting: boolean;
  deleteMessage: (messageId: number) => void;
};

export default function ChatMessages({ messages, deleteMessage, isThinking, isPlanning, isExecuting, isRedirecting }: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]'); 
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-grow p-4 mt-16"
    >
      {messages.map((message) => (
  <div
    key={message.id}
    className={`mb-4 group ${
      message.sender === "user" ? "text-right" : "text-left"
    }`}
  >
    <div className="relative inline-block">
      <div
        className={`p-2 rounded-lg ${
          message.sender === "user"
            ? message.isSent
              ? "bg-primary text-primary-foreground"
              : "border border-primary text-primary"
            : "bg-muted text-black"
        }`}
      >
        <ReactMarkdown className="whitespace-pre-wrap break-words">
          {message.content}
        </ReactMarkdown>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => deleteMessage(message.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    {message.post && <SocialMediaPost {...message.post} />}
  </div>
))}

      {isThinking && (
        <div className="flex justify-start mb-4">
          <div className="bg-primary p-2 rounded-lg flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{isExecuting ? "Executing" : isPlanning ? "Planning" : isRedirecting ? "Redirecting" : "Thinking"}</span>
          </div>
        </div>
      )}

    </ScrollArea>
  );
}