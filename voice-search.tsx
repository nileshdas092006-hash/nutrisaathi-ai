
"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface VoiceSearchProps {
  onResult: (text: string) => void;
}

const REGIONAL_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  ml: "ml-IN",
  as: "as-IN",
};

export function VoiceSearch({ onResult }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const { toast } = useToast();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setBrowserSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    
    // Support English, Hindi, Bengali, Tamil, Telugu specifically, fallback to current or English
    recognition.lang = REGIONAL_LANG_MAP[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        onResult(transcript);
      } else {
        toast({
          title: t("VOICE_SEARCH_ERROR"),
          variant: "destructive",
        });
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      // Provide specific error feedback
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: t("VOICE_SEARCH_ERROR"),
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      setIsListening(false);
    }
  };

  if (!browserSupported) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startListening}
            disabled={isListening}
            className={`rounded-full transition-all w-10 h-10 ${isListening ? "bg-primary/20 text-primary animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
          >
            {isListening ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-xl border-border/50 shadow-xl bg-white text-xs font-bold py-2">
          {isListening ? t("VOICE_SEARCH_HINT") : "Voice Search"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
