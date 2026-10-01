# Lyric alignment

## Current status

`data/lyrics.json` contains a **provisional** alignment for all 33 lyric lines and their words.

It is intentionally labelled provisional.

## How it was generated

The source text is known exactly. The current pass:

1. uses the 139.24 s source mix;
2. allocates expected phrase duration from the lyric text;
3. searches near expected line boundaries for local low-energy minima in the waveform;
4. snaps phrase boundaries toward those minima;
5. distributes word durations within each phrase.

This is considerably better than dividing the song uniformly, and it is useful for scene development because semantic events land in the correct part of the recording.

It is **not** a substitute for final forced alignment.

## Intended use

Suitable now for:

- finding lyric lines by content;
- defining scene windows;
- rough word highlighting;
- visual prototyping;
- deciding camera and network events.

Before final rendering, replace or QA the timings with forced alignment using a CTC/Whisper-class model, especially where a visual event must land exactly on a consonant or syllable.

## Design consequence

Scenes import `data/lyrics.json` rather than copying timestamps into scene code.

That means improved alignment data can replace the provisional file later without rewriting the visual logic.

## First three provisional line windows

| Lyric | Start | End |
|---|---:|---:|
| Nobody invented kindness. | 0.900 | 3.910 |
| People gave it a name. | 3.910 | 9.250 |
| But kindness was already there. | 9.250 | 13.440 |

These currently drive the opening scene.
