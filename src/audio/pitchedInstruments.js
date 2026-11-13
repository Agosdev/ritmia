// Tuned instruments are distinct from one-shot percussion. Notes are MIDI pitches.
export const PITCHED_INSTRUMENTS = {
  electricBass: {
    name: 'Bajo eléctrico de dedos',
    notes: {
      31: { file: 'instruments/bass-g1.wav', rootMidi: 31 }, // G1, exact recorded pitch
      38: { file: 'instruments/bass-d2.wav', rootMidi: 38 }, // D2, exact recorded pitch
    },
    maxDuration: 0.42,
  },
}

export function resolvePitchedNote(id, midi) {
  const instrument = PITCHED_INSTRUMENTS[id]
  const sample = instrument?.notes[midi]
  return sample ? { ...sample, duration: instrument.maxDuration } : null
}
