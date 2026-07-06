# Vibe Check — iOS App (Capacitor)

The web app is wrapped in [Capacitor](https://capacitorjs.com) so it can ship to the
App Store. The native project lives in `ios/` and is committed to this repo.

## How the "live sync" works

The app can run in two modes, controlled by `capacitor.config.ts`:

| Mode | What ships in the binary | When UI updates |
|------|--------------------------|-----------------|
| **Live sync** (default) | A thin native shell; the WebView loads your live Lovable app over the network | Every time you publish changes in Lovable — no rebuild, no App Store update |
| **Bundled** | The full web app, built into the binary | Only when you rebuild and re-submit |

In live-sync mode the shell points at the Lovable **preview** URL
(`https://<project-id>.lovableproject.com`), which reflects every edit you make in
Lovable. For a production/App Store build, consider pointing it at your **published**
URL instead (Share → Publish in Lovable, or your custom domain) so users see the
published version, not work-in-progress:

```sh
CAP_SERVER_URL=https://your-published-domain.com npx cap sync ios
```

To build fully bundled (self-contained, works offline):

```sh
npm run ios:sync:bundled
```

## Building on your Mac

Prerequisites: Xcode 15+ (from the App Store) and Node. No CocoaPods needed —
the project uses Swift Package Manager.

```sh
git pull
npm install
npm run ios:sync      # builds web assets + syncs the iOS project
npm run ios:open      # opens Xcode
```

In Xcode (first time only):

1. Select the **App** target → **Signing & Capabilities** tab.
2. Check **Automatically manage signing** and pick your team
   (you need an [Apple Developer account](https://developer.apple.com), $99/yr).
3. The bundle ID is `app.lovable.vibecheck` — change it if you prefer your own
   reverse-domain (also update `appId` in `capacitor.config.ts` to match).

Then plug in your iPhone (or pick a simulator) and hit **Run** ▶.

## Pushing to TestFlight

1. In [App Store Connect](https://appstoreconnect.apple.com), create a new app
   with the same bundle ID.
2. In Xcode: select **Any iOS Device (arm64)** as the destination, then
   **Product → Archive**.
3. When the Organizer window opens: **Distribute App → App Store Connect → Upload**.
4. The build appears in TestFlight after processing (~10–30 min). Add yourself as
   an internal tester and install via the TestFlight app.

Export compliance is pre-answered (`ITSAppUsesNonExemptEncryption = false` in
Info.plist — the app only uses standard HTTPS).

## Things to know before a real App Store submission

- **Apple guideline 4.2 (minimum functionality):** apps that are "just a website
  in a wrapper" sometimes get rejected. The live-sync build is great for personal
  use and TestFlight; for the public App Store, the safer play is the **bundled**
  build plus a couple of native touches (haptics, share sheet, push notifications —
  all easy to add as Capacitor plugins later).
- **App icon:** the current icon (`resources/logo.png`, upscaled from
  `public/icon-512.png`) has a checkerboard "transparency" pattern baked into the
  image. It works, but it looks like a placeholder — replace `resources/logo.png`
  with a clean 1024×1024 image and run
  `npx @capacitor/assets generate --ios --assetPath resources --iconBackgroundColor '#1a0d29' --splashBackgroundColor '#1a0d29'`
  on your Mac to regenerate the icon + splash screens.
- **Camera:** the app's `getUserMedia` camera works inside the WebView
  (iOS 14.3+). Usage descriptions are already set in `Info.plist`; iOS shows the
  permission prompt on first use.
- **Live-sync needs network** on launch. The web app's service worker caches
  assets after the first load, but a fresh install with no connectivity shows a
  blank screen. Bundled mode avoids this entirely.

## Android later?

`@capacitor/android` is already installed — `npx cap add android` generates the
project whenever you want a Play Store build.
