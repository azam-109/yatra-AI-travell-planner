import { Mic } from "lucide-react";

export default function VoiceInputButton({ onTranscript }) {
  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      onTranscript(event.results[0][0].transcript);
    };
    recognition.start();
  }

  return (
    <button
      type="button"
      title="Voice input"
      onClick={startVoice}
      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/10 hover:text-white"
    >
      <Mic size={18} />
    </button>
  );
}
