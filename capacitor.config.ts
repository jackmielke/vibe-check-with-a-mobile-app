import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Two ways to run the native app:
 *
 * 1. LIVE SYNC (default) — the native shell loads your live Lovable app over
 *    the network. Changes you make in Lovable show up in the native app on
 *    next launch, with no rebuild and no App Store update.
 *
 * 2. BUNDLED — the web assets built into `dist/` are packaged inside the
 *    binary (works offline, fully self-contained). Build with:
 *      CAP_BUNDLED=1 npx cap sync ios
 *
 * You can also point at a different URL (e.g. your published domain instead
 * of the Lovable preview):
 *      CAP_SERVER_URL=https://your-domain.com npx cap sync ios
 */

// Lovable preview URL — updates on every Lovable edit. Swap for your
// published URL (Share -> Publish domain) for production builds.
const LIVE_URL =
  'https://6e603d6c-a019-451b-8ef2-78d84822836b.lovableproject.com?forceHideBadge=true';

const bundled = !!process.env.CAP_BUNDLED;
const serverUrl = process.env.CAP_SERVER_URL ?? LIVE_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.vibecheck',
  appName: 'Vibe Check',
  webDir: 'dist',
  ...(bundled
    ? {}
    : {
        server: {
          url: serverUrl,
          cleartext: false,
        },
      }),
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a0d29',
  },
};

export default config;
