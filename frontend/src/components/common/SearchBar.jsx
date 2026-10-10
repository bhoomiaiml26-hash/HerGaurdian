import { useState } from "react";
import { Search, Mic, MicOff } from "lucide-react";
import toast from "react-hot-toast";

function SearchBar({ value, onChange, placeholder = "Search directory or topics...", inputClassName = "" }) {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Voice input active...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onChange({ target: { value: transcript } });
      toast.success(`Search set to: "${transcript}"`);
    };

    recognition.onerror = () => {
      toast.error("Audio capture failed. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="relative flex w-full md:w-80 items-center">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78726B]" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[#EDE6E2] bg-white py-2.5 pl-9 pr-10 text-xs text-[#1E1B18] placeholder-[#78726B] shadow-xs outline-none transition focus:border-[#8C3737] ${inputClassName}`}
      />
      <button
        type="button"
        onClick={handleVoiceSearch}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition ${
          isListening
            ? "bg-[#FDF2F2] text-[#BA2626] animate-pulse"
            : "text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#8C3737]"
        }`}
        title="Voice Search"
      >
        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default SearchBar;
