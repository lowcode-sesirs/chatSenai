import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState("")

  const handleSend = () => {
    if (!value.trim()) return
    onSend(value)
    setValue("")
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Digite sua pergunta ..."
        className="bg-zinc-900 text-white resize-none"
        rows={2}
        disabled={loading}
      />
      <Button onClick={handleSend} disabled={loading}>
        Enviar
      </Button>
    </div>
  )
}
