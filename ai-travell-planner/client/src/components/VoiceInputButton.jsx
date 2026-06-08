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
      className="grid h-11 w-11 place-items-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
    >
      <Mic size={18} />
    </button>
  );
}
