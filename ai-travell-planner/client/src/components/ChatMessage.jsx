import { Bot, UserRound } from "lucide-react";
import { classNames } from "./TravelUI.jsx";

export default function ChatMessage({ role, content }) {
  const isUser = role === "user";
  const isEmptyAssistant = !isUser && !content?.trim();

  return (
    <div className={classNames("flex animate-fade-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={classNames(
          "max-w-[92%] rounded-[28px] border px-4 py-4 text-sm leading-7 shadow-[0_18px_50px_rgba(2,8,23,0.24)] sm:max-w-3xl",
          isUser
            ? "border-cyan-300/20 bg-gradient-to-br from-cyan-500 to-indigo-500 text-slate-950"
            : "border-white/10 bg-white/[0.06] text-white/90 backdrop-blur-xl"
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.55]">
          <span className={classNames("grid h-7 w-7 place-items-center rounded-full", isUser ? "bg-slate-950/[0.15] text-slate-950" : "bg-white/10 text-cyan-200")}>
            {isUser ? <UserRound size={14} /> : <Bot size={14} />}
          </span>
          {isUser ? "You" : "AI Travel Agent"}
        </div>

        {isEmptyAssistant ? (
          <div className="space-y-2">
            <div className="h-3 w-48 animate-shimmer rounded-full bg-white/10" />
            <div className="h-3 w-3/4 animate-shimmer rounded-full bg-white/10" />
            <div className="h-3 w-2/3 animate-shimmer rounded-full bg-white/10" />
            <p className="pt-2 text-xs uppercase tracking-[0.2em] text-white/[0.45]">Streaming insights</p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
}
