"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error internally for debugging
    console.error("Runtime Error caught by Boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in duration-500">
      <div className="bg-destructive/10 p-6 rounded-[2rem] mb-8">
        <AlertCircle className="w-16 h-16 text-destructive" />
      </div>
      
      <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground max-w-md mb-10 text-lg leading-relaxed">
        We encountered an unexpected error while analyzing your food. Don't worry, your health profile is safe.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button 
          onClick={() => reset()}
          size="lg"
          className="rounded-full px-10 h-14 font-bold text-lg shadow-xl shadow-primary/20"
        >
          <RefreshCcw className="mr-2 h-5 w-5" />
          Try Again
        </Button>
        <Button 
          asChild
          variant="outline"
          size="lg"
          className="rounded-full px-10 h-14 font-bold text-lg"
        >
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
        </Button>
      </div>
      
      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground opacity-50">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
