"use client"; // Error components must be Client Components

// import * as Sentry from "@sentry/nextjs"; // No longer strictly needed here if relying on auto-instrumentation
// import { useEffect } from "react"; // No longer strictly needed here
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Sentry's automatic error capturing for Next.js (both server and client)
  // should generally handle reporting this error. The explicit call:
  // useEffect(() => { Sentry.captureException(error); }, [error]);
  // can sometimes conflict if Sentry deems it's an error it already caught
  // or should catch via server mechanisms, leading to the warning.
  // We are relying on Sentry's auto-instrumentation.

  return (
    // This component should return the UI for the error,
    // not a full HTML document. The RootLayout handles <html> and <body>.
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
       <h2 className="text-2xl font-semibold text-destructive mb-4">Something went wrong!</h2>
       <p className="text-muted-foreground mb-6">
         An unexpected error occurred. We've been notified and are looking into it.
       </p>
       {process.env.NODE_ENV === 'development' && (
         <details className="mb-6 text-left bg-muted p-4 rounded-md w-full max-w-2xl overflow-auto">
           <summary className="cursor-pointer font-medium">Error Details</summary>
           <pre className="mt-2 text-xs whitespace-pre-wrap">
             {error?.message && <code>Message: {error.message}</code>}
             {error?.digest && <code className="block mt-2">Digest: {error.digest}</code>}
             {error?.stack && <code className="block mt-2 whitespace-pre-wrap">Stack: {error.stack}</code>}
           </pre>
         </details>
       )}
      <Button
        onClick={() => reset()}
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
