import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
interface SocialMediaPostProps {
  imageUrl?: string
  videoUrl?: string
  caption?: string
  hashtags?: string[]
}

export default function Component({ imageUrl, videoUrl, caption, hashtags }: SocialMediaPostProps = {}) {
  const { toast } = useToast()
  const [copied, setCopied] = useState({ caption: false, hashtags: false })

  const copyToClipboard = (text: string, type: 'caption' | 'hashtags') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(prev => ({ ...prev, [type]: true }))
      toast({
        title: "Copied to clipboard",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been copied to your clipboard.`,
      })
      setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000)
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardContent className="p-4">
        {imageUrl && (
          <div className="relative w-full h-64 mb-4">
            <Image
              src={imageUrl}
              alt="Post image"
              fill
              className="object-cover rounded-md"
            />
          </div>
        )}
        {videoUrl && (
          <video src={videoUrl} controls className="w-full h-64 mb-4 rounded-md">
            Your browser does not support the video tag.
          </video>
        )}
        {caption && (
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm text-gray-600 flex-grow mr-2">{caption}</p>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => copyToClipboard(caption, 'caption')}
            >
              <Copy className={copied.caption ? "text-green-500" : "text-gray-500"} />
              <span className="sr-only">Copy caption</span>
            </Button>
          </div>
        )}
        {hashtags && hashtags.length > 0 && (
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-1 mr-2">
              {hashtags.map((tag, index) => (
                <span key={index} className="text-sm text-blue-500">#{tag}</span>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => copyToClipboard(hashtags.map(tag => `#${tag}`).join(' '), 'hashtags')}
            >
              <Copy className={copied.hashtags ? "text-green-500" : "text-gray-500"} />
              <span className="sr-only">Copy hashtags</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
