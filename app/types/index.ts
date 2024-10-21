export type PostData = {
  caption?: string;
  hashtags?: string[];
  imageUrl?: string;
  videoUrl?: string;
  message?: string;
};

export type Message = {
  id: number
  content: string
  sender: "user" | "ai",
  isSent: boolean
  post?: PostData
}

export type ChatHistory = {
  id: string
  title: string
  messages: Message[]
}