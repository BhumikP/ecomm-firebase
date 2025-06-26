// src/instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    // Enable Spotlight in development for local debugging.
    // https://spotlightjs.com/spotlight/getting-started/nodejs
    // Note: Spotight requires NODE_OPTIONS="--enable-source-maps" starting Node 18.
    spotlight: process.env.NODE_ENV === 'development',

    // Consider adding profiling for performance monitoring
    // profilesSampleRate: 1.0,
  });
}
