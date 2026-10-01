# Analysis

The analysis layer turns the source WAV and lyrics into deterministic timing data used by the renderer.

Planned outputs:

- `../data/lyrics.json`: line- and word-level lyric alignment;
- `../data/audio.json`: duration, tempo, beats, downbeats, sections, energy envelopes, and selected onsets.

Initial implementation should stay lightweight. Start with beat/energy analysis and a practical lyric-alignment route, then refine timings manually only where the visuals need it.
