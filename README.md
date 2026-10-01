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

1. add the distributable soundtrack as `audio/Kindness Is Not Magic 1.mp3`;
2. refine the provisional word alignment with forced alignment/QA;
3. refine musical downbeats/sections and audio-energy data;
4. continue expanding the visual plates;
5. render the final 1080p/4K video.

## Audio

Canonical soundtrack path:

```
audio/Kindness Is Not Magic 1.mp3
```

A lossless WAV can still be kept for analysis if desired. The MP3 and WAV versions were compared after decoding: both are 139.24 seconds, 48 kHz stereo, with zero detected timing offset and near-identical waveform timing, so the MP3 can replace the WAV for preview/final muxing without changing scene timings.

A first-pass beat grid is committed in `data/audio.json`.

## Rights and licenses

- **Software/code:** MIT License — see `LICENSE`.
- **Song recording:** CC BY 4.0.
- **Lyrics:** CC BY 4.0.

See `RIGHTS.md` for the media-rights statement.

The software license and media licenses are deliberately separate.
