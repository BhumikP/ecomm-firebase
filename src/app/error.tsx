"use client"; // Error components must be Client Components

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
       <h2 className="text-2xl font-semibold text-destructive mb-4">Something went wrong!</h2>
       <p className="text-muted-foreground mb-6">
         An unexpected error occurred. We've been notified and are looking into it.
       </p>
       {/* Optionally display error details during development */}
       {process.env.NODE_ENV === 'development' && (
         <details className="mb-6 text-left bg-muted p-4 rounded-md w-full max-w-2xl overflow-auto">
           <summary className="cursor-pointer font-medium">Error Details</summary>
           <pre className="mt-2 text-xs whitespace-pre-wrap">
             <code>{error?.message}</code>
             {error?.stack && <code className="block mt-2">{error.stack}</code>}
             {error?.digest && <code className="block mt-2">Digest: {error.digest}</code>}
           </pre>
         </details>
       )}
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
         variant="outline"
      >
        Try again
      </Button>
      <Button asChild variant="link" className="mt-4">
         <a href="/">Go back home</a>
       </Button>
     </div>
  );
}
