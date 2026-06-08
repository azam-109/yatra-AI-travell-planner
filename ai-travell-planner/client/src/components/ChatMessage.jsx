export default function ChatMessage({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl whitespace-pre-wrap rounded p-4 text-sm leading-6 shadow-sm ${
          isUser ? "bg-reef text-white" : "bg-white text-ink"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
