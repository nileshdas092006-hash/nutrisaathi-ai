"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background text-foreground">
          <div className="bg-destructive/10 p-6 rounded-[2rem] mb-8">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>
          
          <h2 className="text-5xl font-extrabold mb-4 tracking-tight">Critical System Error</h2>
          <p className="text-muted-foreground max-w-md mb-10 text-xl leading-relaxed">
            The application encountered a critical failure. Please click below to restart the environment.
          </p>

          <Button 
            onClick={() => reset()}
            size="lg"
            className="rounded-full px-12 h-16 font-extrabold text-xl shadow-2xl shadow-primary/30"
          >
            <RefreshCcw className="mr-3 h-7 w-7" />
            Restart Application
          </Button>
        </div>
      </body>
    </html>
  );
}
