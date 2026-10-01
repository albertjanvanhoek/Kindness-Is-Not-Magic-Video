# How to render a preview

You do not need to install anything locally.

## One-time step

Upload the soundtrack to this exact repository path:

`audio/kindness-is-not-magic.mp3`

The renderer will still make a silent preview if the MP3 is absent.

## Render a preview on GitHub

1. Open the repository on GitHub.
2. Click **Actions**.
3. Choose **render preview**.
4. Click **Run workflow**.
5. Choose a section:
   - `opening` — 0–15 s
   - `mechanisms` — help/share/comfort/truth
   - `payoff` — emergence/trust/stronger/not-magic
   - `repair` — sharing/listening/wrong/forgive
   - `final-third` — failure through ending
   - `full` — complete song
6. Click **Run workflow**.
7. When the run is complete, open it and download the artifact named `kindness-<section>`.

The artifact contains an MP4 preview.

## Preview quality

The default is deliberately phone-first:

- 1280 × 720
- 30 fps
- H.264 video
- AAC audio when the MP3 exists
- optimized for quick review rather than master delivery

This is enough to judge pacing, readability, transitions, and whether the visual idea works on a phone.

## Development strategy

Render short sections first. A useful review order is:

1. `opening`
2. `mechanisms`
3. `payoff`
4. `repair`
5. `final-third`
6. only then `full`

Short previews are faster and make it easier to identify specific scenes that need redesign.
