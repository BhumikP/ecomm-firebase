// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0, // Sample 100% of transactions - adjust in production

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Optional: Add integrations specific to the server environment if needed
  // integrations: [],

  // Enable Spotlight in development for local debugging.
  // Note: Spotight requires NODE_OPTIONS="--enable-source-maps" starting Node 18.
  // https://spotlightjs.com/spotlight/getting-started/nodejs
  spotlight: process.env.NODE_ENV === 'development',

  // Consider adding profiling for performance monitoring
  // profilesSampleRate: 1.0,
});
