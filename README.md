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
audio/              local source audio; not committed by default
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

Initial treatment and architecture are in place. Next milestones:

1. align lyrics to the WAV at word level;
2. detect beat/downbeat and audio-energy structure;
3. generate `data/lyrics.json` and `data/audio.json`;
4. implement the shared thread/network visual primitive;
5. build the opening scene and browser preview;
6. expand plate by plate;
7. render the final 1080p/4K video.

## Audio

The working song is `Kindness Is Not Magic (1).wav`.

The source audio is intentionally not committed yet. Put it locally at:

```
audio/kindness-is-not-magic.wav
```

Generated timing data can be committed separately.

## License

Code in this repository is released under the MIT License unless otherwise noted.

The song recording and lyrics are **not automatically covered by the MIT software license**. Their rights should be documented separately before public release.
