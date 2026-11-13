// Bass parts are independent from drum articulations and use each preset's existing grid.
// MIDI 31 = G1 (tonic) and MIDI 38 = D2 (fifth); both are exact samples.
const line = (events, defaultEnabled = false) => ({ key: 'G minor (root and fifth only)', events, defaultEnabled })

export const BASS_PATTERNS = {
  'funk-clasico': line([
    { position: 0, midi: 31, velocity: 0.92 },
    { position: 3, midi: 38, velocity: 0.55 },
    { position: 7, midi: 31, velocity: 0.72 },
    { position: 10, midi: 38, velocity: 0.58 },
    { position: 14, midi: 31, velocity: 0.84 },
  ], true),
  'blues-shuffle': line([
    { position: 0, midi: 31, velocity: 0.82 }, { position: 2, midi: 38, velocity: 0.52 },
    { position: 3, midi: 31, velocity: 0.62 }, { position: 5, midi: 38, velocity: 0.50 },
    { position: 6, midi: 31, velocity: 0.76 }, { position: 8, midi: 38, velocity: 0.52 },
    { position: 9, midi: 31, velocity: 0.65 }, { position: 11, midi: 38, velocity: 0.48 },
  ]),
  'slow-blues': line([
    { position: 0, midi: 31, velocity: 0.82 }, { position: 3, midi: 38, velocity: 0.52 },
    { position: 6, midi: 31, velocity: 0.72 }, { position: 9, midi: 38, velocity: 0.50 },
  ]),
}
