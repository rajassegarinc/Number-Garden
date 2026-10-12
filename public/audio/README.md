# Victory music (optional)

No bundled music file exists yet, so none was fabricated — the victory
screen currently uses a short synthesized chime instead (see
`src/utils/celebrationChime.ts`).

To use real instrumental music, add a file at exactly:

```
public/audio/victory-music.mp3
```

Requirements for whatever you add:
- Gentle, cheerful, instrumental (no lyrics, nothing jarring).
- Short (a victory screen is on-screen briefly — 3-8s loops well; the code
  does not loop it, so a slightly longer single play works too).
- Verified usage rights (public domain, CC0, or a license you hold) — do not
  add a copyrighted commercial track.

Once the file exists, `useCelebrationAudio` picks it up automatically and
the synthesized chime becomes the fallback for whenever it fails to load.
