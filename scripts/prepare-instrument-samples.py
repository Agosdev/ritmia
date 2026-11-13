#!/usr/bin/env python3
"""Build only the selected one-shots. Development tools: numpy, soundfile.
Usage: python3 scripts/prepare-instrument-samples.py --source-dir /tmp/ritmia-sources
Missing originals are downloaded individually from pinned URLs; no full banks.
"""
import argparse, hashlib, json, math, urllib.request
from pathlib import Path
import numpy as np
import soundfile as sf
def resample_audio(audio, rate, target=44100):
    if rate == target: return audio.copy()
    # Windowed-sinc interpolation with anti-alias cutoff, in bounded blocks.
    cutoff = min(1.0, target / rate) * .95
    output = np.empty(round(len(audio) * target / rate))
    offsets = np.arange(-31, 33)
    for start in range(0, len(output), 2048):
        positions = np.arange(start, min(start + 2048, len(output))) * rate / target
        indices = np.floor(positions).astype(int)[:, None] + offsets
        distance = positions[:, None] - indices
        window = np.where(abs(distance) < 32, .5 + .5 * np.cos(np.pi * distance / 32), 0)
        weights = cutoff * np.sinc(cutoff * distance) * window
        weights /= weights.sum(axis=1, keepdims=True)
        samples = audio[np.clip(indices, 0, len(audio)-1)]
        samples[(indices < 0) | (indices >= len(audio))] = 0
        output[start:start+len(positions)] = (samples * weights).sum(axis=1)
    return output

def highpass(audio, rate):
    alpha = math.exp(-2 * math.pi * 120 / rate)
    result = np.empty_like(audio)
    previous = 0.0
    for i in range(len(audio)):
        previous = alpha * (previous + audio[i] - (audio[i-1] if i else 0))
        result[i] = previous
    return result

SOURCES = [{'name': 'dum',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/Darbuka/doom_01_01.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/Darbuka/doom_01_01.flac',
  'file': 'darbuka-dum.wav',
  'maxSeconds': 1.0,
  'license': 'CC0-1.0'},
 {'name': 'tak',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/Darbuka/tak_02_01.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/Darbuka/tak_02_01.flac',
  'file': 'darbuka-tak.wav',
  'maxSeconds': 0.65,
  'license': 'CC0-1.0'},
 {'name': 'pa',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/Darbuka/pa_03_01.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/Darbuka/pa_03_01.flac',
  'file': 'darbuka-pa.wav',
  'maxSeconds': 0.65,
  'license': 'CC0-1.0'},
 {'name': 'cajon1',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/CajonFlamenco/101.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/CajonFlamenco/101.flac',
  'file': 'cajon-edge.wav',
  'maxSeconds': 0.8,
  'license': 'CC0-1.0'},
 {'name': 'cajon2',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/CajonFlamenco/106.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/CajonFlamenco/106.flac',
  'file': 'cajon-bass.wav',
  'maxSeconds': 0.65,
  'license': 'CC0-1.0'},
 {'name': 'clap',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/HandClap/01_02.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/HandClap/01_02.flac',
  'file': 'palmas.wav',
  'maxSeconds': 0.5,
  'license': 'CC0-1.0'},
 {'name': 'castanet',
  'repository': 'freepats/world-percussion',
  'revision': 'e54eb2912a0d6d4444ab205d52f778e27da0fc96',
  'sourceFile': 'samples/Castanets/01.flac',
  'url': 'https://raw.githubusercontent.com/freepats/world-percussion/e54eb2912a0d6d4444ab205d52f778e27da0fc96/samples/Castanets/01.flac',
  'file': 'castanets.wav',
  'maxSeconds': 0.4,
  'license': 'CC0-1.0'},
 {'name': 'hat-soft',
  'repository': 'freepats/muldjordkit',
  'revision': '719fe72bc6693b94f1229674e202881145ab44ed',
  'sourceFile': 'samples/HihatClosed/1-HihatClosed.flac',
  'url': 'https://raw.githubusercontent.com/freepats/muldjordkit/719fe72bc6693b94f1229674e202881145ab44ed/samples/HihatClosed/1-HihatClosed.flac',
  'file': 'hihat-soft.wav',
  'maxSeconds': 0.65,
  'license': 'CC-BY-4.0'},
 {'name': 'hat-strong',
  'repository': 'freepats/muldjordkit',
  'revision': '719fe72bc6693b94f1229674e202881145ab44ed',
  'sourceFile': 'samples/HihatClosed/20-HihatClosed.flac',
  'url': 'https://raw.githubusercontent.com/freepats/muldjordkit/719fe72bc6693b94f1229674e202881145ab44ed/samples/HihatClosed/20-HihatClosed.flac',
  'file': 'hihat-strong.wav',
  'maxSeconds': 0.8,
  'license': 'CC-BY-4.0'},
 {'name': 'crash',
  'repository': 'freepats/muldjordkit',
  'revision': '719fe72bc6693b94f1229674e202881145ab44ed',
  'sourceFile': 'samples/CrashL/3-CrashL.flac',
  'url': 'https://raw.githubusercontent.com/freepats/muldjordkit/719fe72bc6693b94f1229674e202881145ab44ed/samples/CrashL/3-CrashL.flac',
  'file': 'crash.wav',
  'maxSeconds': 3.0,
  'license': 'CC-BY-4.0'},
 {'name': 'zills',
  'repository': 'sgossner/VCSL',
  'revision': 'c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e',
  'sourceFile': 'Idiophones/Struck Idiophones/Finger Cymbals/Fing_Cymb.wav',
  'url': 'https://raw.githubusercontent.com/sgossner/VCSL/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/Idiophones/Struck%20Idiophones/Finger%20Cymbals/Fing_Cymb.wav',
  'file': 'finger-cymbals.wav',
  'maxSeconds': 2.5,
  'license': 'CC0-1.0'},
 {'name': 'ride',
  'repository': 'sfzinstruments/virtuosity_drums',
  'revision': '9f04cf9a734527edfbb0a4eee1f674e45bbf71bc',
  'sourceFile': 'Samples/mid/ride/mid_ride_ride_vl1_rr1.flac',
  'url': 'https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/mid/ride/mid_ride_ride_vl1_rr1.flac',
  'file': 'ride.wav',
  'maxSeconds': 2.5,
  'onsetThreshold': 0.02,
  'prerollSeconds': 0.001,
  'license': 'CC0-1.0'},
 {'name': 'pedal-hat',
  'repository': 'sfzinstruments/virtuosity_drums',
  'revision': '9f04cf9a734527edfbb0a4eee1f674e45bbf71bc',
  'sourceFile': 'Samples/mid/hh/mid_hh_pedal_vl1_rr1.flac',
  'url': 'https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/mid/hh/mid_hh_pedal_vl1_rr1.flac',
  'file': 'pedal-hat.wav',
  'maxSeconds': 0.45,
  'onsetThreshold': 0.05,
  'prerollSeconds': 0.001,
  'license': 'CC0-1.0'},
 {'name': 'bass-g1',
  'repository': 'freepats/electric-bass-YR',
  'revision': '8dcb7ea9116f417273ef8c030d15e7b3aa654301',
  'sourceFile': 'samples/finger/G.flac',
  'url': 'https://raw.githubusercontent.com/freepats/electric-bass-YR/8dcb7ea9116f417273ef8c030d15e7b3aa654301/samples/finger/G.flac',
  'file': 'bass-g1.wav',
  'maxSeconds': 0.75,
  'license': 'CC0-1.0'},
 {'name': 'bass-d2',
  'repository': 'freepats/electric-bass-YR',
  'revision': '8dcb7ea9116f417273ef8c030d15e7b3aa654301',
  'sourceFile': 'samples/finger/D.flac',
  'url': 'https://raw.githubusercontent.com/freepats/electric-bass-YR/8dcb7ea9116f417273ef8c030d15e7b3aa654301/samples/finger/D.flac',
  'file': 'bass-d2.wav',
  'maxSeconds': 0.75,
  'license': 'CC0-1.0'}]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, default=Path('public/audio/instruments'))
    parser.add_argument('--only', nargs='+', help='Prepare selected sample names, retaining the existing manifest')
    args = parser.parse_args()
    args.source_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    previous = args.output_dir / 'manifest.json'
    manifest = json.loads(previous.read_text())['samples'] if args.only and previous.exists() else []
    for entry in SOURCES:
        if args.only and entry['name'] not in args.only: continue
        manifest = [sample for sample in manifest if sample['file'] != entry['file']]
        original = args.source_dir / (entry['name'] + Path(entry['sourceFile']).suffix)
        if not original.exists():
            urllib.request.urlretrieve(entry['url'], original)
        audio, rate = sf.read(original, dtype='float64', always_2d=True)
        audio = audio.mean(axis=1)
        if entry['name'] == 'zills': audio = highpass(audio - audio.mean(), rate)
        peak = float(np.max(np.abs(audio)))
        if not peak: raise ValueError(f'Silent source: {original}')
        # Discard only near-silent leading pad, retaining 3 ms before the onset.
        onsets = np.flatnonzero(np.abs(audio) > peak * entry.get('onsetThreshold', .001))
        start = max(0, int(onsets[0]) - round(rate * entry.get('prerollSeconds', .003)))
        audio = audio[start:]
        audio = resample_audio(audio, rate)
        # Remove near-silent end pad; cap long cymbal tails explicitly.
        significant = np.flatnonzero(np.abs(audio) > peak * .001)
        end = min(len(audio), int(significant[-1]) + 882, round(entry['maxSeconds'] * 44100))
        audio = audio[:end].copy()
        fade = min(len(audio) // 4, round(44100 * (.12 if entry['name'] in ['crash','zills','ride'] else .03)))
        audio[-fade:] *= .5 + .5 * np.cos(np.linspace(0, np.pi, fade))
        audio *= .48 / np.max(np.abs(audio)) # shared headroom; dynamics are applied by the hit plan
        dest = args.output_dir / entry['file']
        sf.write(dest, audio, 44100, subtype='PCM_16')
        decoded, _ = sf.read(dest)
        manifest.append({**entry, 'author': 'Austin McMahon; Versilian Studios LLC (Virtuosity Drums)' if entry['repository']=='sfzinstruments/virtuosity_drums' else 'Lars Muldjord; FreePats adaptation by Roberto' if entry['license']=='CC-BY-4.0' else 'Versilian Studios LLC' if entry['repository']=='sgossner/VCSL' else 'Xavimart, Gonzalo and Roberto (FreePats); hand clap recorded by Roberto',
            'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
            'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'bytes': dest.stat().st_size,
            'sampleRate': 44100, 'channels': 1, 'duration': len(decoded)/44100,
            'peak': float(np.max(np.abs(decoded))),
            'modifications': ('DC removal and 120 Hz single-pole highpass; ' if entry['name']=='zills' else '') + f'Mono average; lead pad removed ({start/rate:.6f} s); 64-tap windowed-sinc resample to 44.1 kHz; silence trim / tail cap {entry["maxSeconds"]} s; cosine fade {fade/44100:.3f} s; peak 0.48; PCM16 WAV.'})
    result = {'samples': manifest, 'totalBytes': sum(x['bytes'] for x in manifest)}
    (args.output_dir / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'samples': len(manifest), 'bytes': result['totalBytes'], 'decodedMonoFloatBytes': sum(round(x['duration']*44100)*4 for x in manifest)}))

if __name__ == '__main__': main()
