export default function ChatMessage({ role, text }) {
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-white border border-zinc-700"
        }`}
      >
        {text}
      </div>
    </div>
  )
}
