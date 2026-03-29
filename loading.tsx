import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
        </div>
      </div>
      <p className="text-sm font-black tracking-widest text-muted-foreground uppercase animate-pulse">
        Initializing Intelligence
      </p>
    </div>
  );
}
