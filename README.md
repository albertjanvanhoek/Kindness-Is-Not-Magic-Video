# Kindness Is Not Magic — Music Video

A code-rendered music video about kindness as the maintenance, repair, and growth of human connection.

The project takes inspiration from the engineering approach of [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video): the song is analysed once, lyrics and musical events are mapped onto a timeline, and every frame is rendered deterministically from song time. The visual language here is original and built around one recurring primitive:

**two points connected by a thread.**

The thread changes meaning throughout the film — help, sharing, listening, truth, correction, forgiveness, repair, trust, family, and collective resilience — while remaining the same underlying structure.

## Core visual thesis

Kindness is not shown as hearts, halos, smiling stock footage, or magic. It is shown as a mechanism:

> actions that maintain, repair, or strengthen connection.

The film begins and ends with the same image:

```
●────────●
```

By the end, the viewer should understand that line differently.

## Repository layout

```
audio/              source audio
lyrics/             source lyrics
analysis/           audio and lyric analysis tools
data/               generated timing data
docs/               concept, treatment, style bible, architecture
app/                deterministic browser renderer
  src/engine/
  src/scenes/
  src/timeline.ts
```

## Status

The conceptual treatment, renderer scaffold, and first-pass beat grid are in place.

Next milestones:

1. commit the source WAV as `audio/kindness-is-not-magic.wav`;
2. align lyrics to the WAV at word level;
3. refine musical downbeats/sections and audio-energy data;
4. connect audio playback to the renderer clock;
5. implement the opening plate in exact musical time;
6. expand plate by plate;
7. render the final 1080p/4K video.

## Audio

Canonical source path:

```
audio/kindness-is-not-magic.wav
```

The working recording is 139.24 seconds, 48 kHz stereo. A first-pass beat grid is committed in `data/audio.json`.

## Rights and licenses

- **Software/code:** MIT License — see `LICENSE`.
- **Song recording:** CC BY 4.0.
- **Lyrics:** CC BY 4.0.

See `RIGHTS.md` for the media-rights statement.

The software license and media licenses are deliberately separate.
