"""Split the supplied 19-line recording without speech synthesis.
Usage: python scripts/prepare-recorded-narration.py /path/to/recording.m4a [--supplement]
Requires FFmpeg and NumPy for offline preparation only.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CUTS = [
    ('introduction', 2.40, 5.70), ('prompt', 7.25, 9.00),
    ('letter-A', 10.62, 11.43), ('letter-C', 12.50, 13.50),
    ('letter-Ç', 14.90, 16.43), ('letter-E', 17.73, 18.50),
    ('letter-M', 19.84, 20.78), ('letter-N', 22.16, 23.12),
    ('letter-O', 24.46, 25.25), ('letter-P', 26.79, 27.54),
    ('letter-S', 29.05, 30.09), ('letter-T', 31.00, 32.10),
    ('letter-U', 33.56, 34.41), ('word-SAPO', 36.00, 37.15),
    ('word-ONÇA', 38.43, 39.45), ('word-TUCANO', 41.25, 42.44),
    ('word-MACACO', 43.83, 45.16), ('retry', 46.70, 49.14),
    ('complete', 50.56, 53.16),
]
SUPPLEMENT_CUTS = [
    ('letter-G', 1.26, 2.36), ('letter-I', 3.78, 4.64),
    ('letter-R', 6.10, 7.10), ('letter-V', 8.30, 9.26),
    ('word-PREGUIÇA', 10.67, 12.12), ('word-SUCURI', 13.08, 14.47),
    # Omit the unrelated utterance at 14.8–15.3 s; keep the complete word.
    ('word-CAPIVARA', 16.10, 18.17), ('word-ARARA', 18.65, 19.77),
]

def run(args, data=None):
    return subprocess.run(['ffmpeg', '-v', 'error', *args], input=data, stdout=subprocess.PIPE, check=True).stdout

def main():
    import unicodedata
    source = Path(sys.argv[1])
    supplement = '--supplement' in sys.argv[2:]
    if supplement:
        assert hashlib.sha256(source.read_bytes()).hexdigest() == '9c1e6efe316fcf197e19424c907ba121f9d66980885effc2951e5d164eabae5d', 'Cuts apply only to the supplied second recording'
    cuts = SUPPLEMENT_CUTS if supplement else CUTS
    output = ROOT / 'public/assets/audio/narration' / ('recorded-v2' if supplement else 'recorded-v1')
    output.mkdir(parents=True, exist_ok=True)
    pcm = np.frombuffer(run(['-i', str(source), '-ac', '1', '-ar', '48000', '-af', 'highpass=f=70', '-f', 'f32le', '-']), dtype='<f4')
    report = {'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'source_duration_seconds': len(pcm)/48000,
              'method': 'User-supplied script order; cuts in silent margins; 70 Hz high-pass; constant gain per clip; 10/20 ms edge fades; no TTS or voice cloning.', 'clips': []}
    for id, start, end in cuts:
        clip = pcm[round(start*48000):round(end*48000)].copy()
        windows = clip[:len(clip)//960*960].reshape(-1, 960)
        energy = np.mean(windows**2, axis=1)
        active = energy[energy > max(10**(-40/10), energy.max()*0.005)]
        rms = np.sqrt(active.mean())
        gain = min(10**(10/20), 10**(-19/20)/rms, 10**(-2.5/20)/np.abs(clip).max())
        clip *= gain
        clip[:480] *= np.linspace(0, 1, 480)
        clip[-960:] *= np.linspace(1, 0, 960)
        slug = 'letter-cedilha' if id == 'letter-Ç' else ''.join(c for c in unicodedata.normalize('NFD', id) if not unicodedata.combining(c)).lower()
        target = output / f'{slug}.mp3'
        run(['-y', '-f', 'f32le', '-ar', '48000', '-ac', '1', '-i', '-', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '96k', str(target)], clip.astype('<f4').tobytes())
        decoded = np.frombuffer(run(['-i', str(target), '-f', 'f32le', '-ac', '1', '-ar', '48000', '-']), dtype='<f4')
        peak = float(np.abs(decoded).max())
        assert np.isfinite(decoded).all() and peak < 0.95
        assert abs(len(decoded)-len(clip)) <= 1
        report['clips'].append({'id': id, 'file': str(target.relative_to(ROOT/'public')), 'source_start': start, 'source_end': end,
                              'duration': len(decoded)/48000, 'gain_db': round(float(20*np.log10(gain)),2), 'peak_dbfs': round(20*np.log10(peak),2),
                              'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    report_file = 'NARRACAO_COMPLEMENTAR_METRICAS.json' if supplement else 'NARRACAO_GRAVADA_METRICAS.json'
    (ROOT/'docs'/report_file).write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'clips':len(report['clips']), 'bytes':sum(c['bytes'] for c in report['clips']), 'peak_dbfs':max(c['peak_dbfs'] for c in report['clips'])}))

if __name__ == '__main__': main()
