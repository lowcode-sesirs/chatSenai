import { useState, useRef, useEffect } from "react"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import { sendMessage, streamAnswer } from "@/services/chatApi"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (text) => {
    setLoading(true)

    const userMsg = { role: "user", text }
    setMessages((prev) => [...prev, userMsg])

    const { chat_session_id } = await sendMessage(text)

    const botMsg = { role: "assistant", text: "" }
    setMessages((prev) => [...prev, botMsg])
    const botIndex = messages.length + 1

    streamAnswer(chat_session_id, {
      onChunk: (chunk) => {
        setMessages((prev) => {
          const updated = [...prev]
          updated[botIndex].text += chunk
          return updated
        })
      },
      onSources: () => {},
      onComplete: () => {
        setLoading(false)
      },
    })
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} text={msg.text} />
        ))}

        {loading && (
          <div className="text-sm text-zinc-400">Digitando...</div>
        )}

        <div ref={endRef} />
      </div>

      <div className="border-t border-zinc-800 p-4">
        <ChatInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  )
}
