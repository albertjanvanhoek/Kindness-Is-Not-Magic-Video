# Architecture

## Goal

Build a deterministic, browser-previewable music video in which every frame is a function of song time.

The architecture follows the useful engineering pattern demonstrated by `mexicat/pdoom-video`, while using an original visual treatment.

## Pipeline

```
audio + lyrics
      │
      ├── lyric alignment ─────→ data/lyrics.json
      │
      └── music analysis ──────→ data/audio.json
                                  │
                                  ▼
                            semantic timeline
                                  │
                                  ▼
                         deterministic renderer
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              browser preview              MP4 render
```

## Data layers

### 1. Lyrics

`data/lyrics.json`

Target shape:

```json
{
  "lines": [
    {
      "text": "Nobody invented kindness.",
      "start": 0.0,
      "end": 3.2,
      "words": [
        {"w": "Nobody", "start": 0.0, "end": 0.7}
      ]
    }
  ]
}
```

### 2. Audio

`data/audio.json`

Target fields:

- duration;
- tempo;
- beats;
- downbeats;
- sections;
- RMS envelope;
- low/mid/high energy;
- vocal energy;
- optional kick/snare/vocal onsets.

### 3. Semantic timeline

`app/src/timeline.ts`

Maps lyric/music windows to scene modules.

Scenes should find their timing from aligned lyric content wherever practical rather than duplicating hard-coded timestamps.

## Renderer

Recommended stack:

- TypeScript;
- Three.js;
- Vite;
- Bun or Node;
- Canvas2D layers where useful;
- headless Chrome/Playwright for offline capture;
- ffmpeg for video/audio muxing.

## Determinism

Visual output should be a pure function of song time plus seeded randomness.

Avoid:

- `Math.random()` without a seed;
- wall-clock time;
- frame-order-dependent behaviour unless explicitly handled.

This keeps browser preview and offline export visually equivalent.

## First implementation target

Build one technically complete vertical slice:

1. local audio playback;
2. timeline clock;
3. two points;
4. animated thread;
5. opening text;
6. first transition;
7. deterministic seek;
8. browser preview.

Once that works, expand plate by plate.
