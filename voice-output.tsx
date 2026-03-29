"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useLanguage } from "@/hooks/use-language";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface VoiceOutputProps {
  text: string;
}

export function VoiceOutput({ text }: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();

  const handleSpeak = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    try {
      const response = await textToSpeech(text);
      if (response && response.media) {
        const audio = new Audio(response.media);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("TTS failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeak}
            disabled={loading}
            className={`rounded-full w-10 h-10 transition-all ${isPlaying ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-xl border-border/50 shadow-xl bg-white text-xs font-bold py-2">
          {isPlaying ? t("VOICE_PLAYING") : t("VOICE_OUTPUT_HINT")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}