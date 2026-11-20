# Decisions

One line each, in the order they were made.

- **The one question:** "What do I actually have to do to win this game?" Answer: talk about what you build, not only build it.
- **The one idea:** the same run, played by the same player, goes broke on day 59 if it never posts, and is kebab profitable on day 43 if it posts instead of coding.
- **Audience:** Product Hunt makers. They already believe "ship it and they will come", and that belief is the hook.
- **Outcome:** after watching, they know the goal (€270 MRR before the cash runs out), the loop (three moves a day), who Chef is, and why posting matters. Then they play today's run.
- **Length:** 48 s, which is 30 bars at 150 BPM. Every scene starts on a bar line.
- **Real data, not illustration:** both runs are recorded from the rules engine (`scripts/runs.ts`, seed `sim-36`, founder David). The one variable changed is the bot's "post" move, replaced by "code".
- **Reuse the game's code:** the room, the founder's poses and the light come from `src/ui/pixels.ts`, and Chef and the spit from the intro's sprite sheet. Nothing is redrawn, so the film cannot drift from the game.
- **Neo Geo finish:** everything is drawn at art resolution (320×180, 216×384, 216×216) and scaled up by whole numbers with nearest-neighbour. The only exception is the camera zoom, which scales the room the way Neo Geo hardware scaled sprites.
- **Mega Man X vibe, not Mega Man X:** vertical segmented energy bars with a portrait cap, a WARNING band before the boss, the boss's bar filling tick by tick, READY before the run. All of it is original drawing and original music; no character, sprite, sound or melody from that game is used.
- **Chef as the boss:** his bar is full from the moment he lands and stays on screen through both runs. He out-earns you until the last scene.
- **No voice-over:** the game speaks in short lines of text, so the film does too. The on-screen lines are the captions; `captions.srt` repeats them and adds the sound cues.
- **Type:** Silkscreen, the game's face, in regular and bold: one family, two weights. Pixel art does not take a second family well.
- **Colour:** the game's navy tokens, with one accent (amber) for the goal, the MRR, the win and the title. Red (#ff8585, 7.7:1) appears only on a minus sign beside the cash bar.
- **Contrast:** body text #e8eff7 on #081726 is 15.6:1, accent #f2b441 on #081726 is 9.8:1, soft #b6cce2 on #081726 is 11.0:1. Text always sits on the ground or a panel, never directly on the room art.
- **Lines:** at most two on screen, at most 8 words each, and each must fit the narrowest band (204 px). `render.mjs` refuses to render a line that does not fit.
- **Blinking:** READY and WARNING blink once a beat (2.5 times a second), under the limit of three.
- **Banned and absent:** neon glow (the room's sign is the game's sprite, untouched), gradients, particles, fake metrics. The streak lines appear only while Chef enters.
- **Sound:** the bed is synthesised in an OfflineAudioContext from the same timeline: square, triangle and seeded noise, E minor, 150 BPM. The effects are the game's own (`public/audio/sfx.mp3`) and play only on actions that carry meaning: rent, the kebab, Chef landing, the win.
- **Motif:** B–E–G–B rising, on "NOW IT POSTS", on "YOU POSTED IT" and under the title.
- **No voice to duck under,** so the bed runs at a fixed level and the effects sit about 6 dB over it.
- **Loudness:** a two-pass ffmpeg loudnorm to -16 LUFS integrated, -1.5 dBTP true peak.
- **Reduced motion:** a separate cut with the same scenes, words and timing, but no typing, wipes, zooms, blinking, entrance or rising numbers. Things cut in at the moment they would have arrived.
- **Formats:** 16:9 at 320×180 ×6 (1920×1080); 9:16 at 216×384 ×5 (1080×1920); 1:1 at 216×216 ×5 (1080×1080). In 1:1 the bars go over the room's edges, without portraits.
- **Product Hunt:** the gallery takes a YouTube or Loom link, not a file, so the master is meant to be uploaded there and its link set as `videoUrl`.
- **Videos are not committed:** `out/*.mp4` stays out of git (`npm run render` makes them again). The captions and the contact sheet are committed.
