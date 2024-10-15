export type Message = {
  id: number
  content: string
  sender: "user" | "ai",
  isSent: boolean
}

export type ChatHistory = {
  id: string
  title: string
  messages: Message[]
}