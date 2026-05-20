// BGM disabled along with the rest of audio. Kept as a no-op so App.tsx
// doesn't need to remove its <BgmRouter /> mount.
export function BgmRouter() {
  return null;
}
