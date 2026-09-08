#!/usr/bin/env python3
"""Compose the original, non-vocal Expedição das Letras audio assets.

Run with Python 3, numpy, scipy and FFmpeg on PATH. No source recordings, MIDI,
soundfonts or third-party musical material are read. The seed, score and physical
instrument approximations below make the PCM reproducible. MP3 bytes additionally
depend on the local FFmpeg/libmp3lame version. WAV masters stay in --masters-dir.

The 120 BPM score is exactly 16 bars / 32 seconds. Instrument and room tails wrap
around the PCM buffer, preserving the downbeat rather than fading every loop.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, resample_poly, sosfilt


ROOT = Path(__file__).resolve().parents[1]
SR = 44_100
BPM = 120
BEAT = 60 / BPM
BARS = 16
LOOP_SECONDS = BARS * 4 * BEAT
SEED = 8_092_026
RNG = np.random.default_rng(SEED)
TAU = 2 * math.pi


def note(midi: float) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def clock(seconds: float) -> np.ndarray:
    return np.arange(round(seconds * SR), dtype=np.float64) / SR


def edges(signal: np.ndarray, attack: float = .003, release: float = .03) -> np.ndarray:
    """Smooth sample starts/ends; no hard waveform truncation."""
    out = signal.copy()
    a, r = min(len(out), round(attack * SR)), min(len(out), round(release * SR))
    if a > 1:
        out[:a] *= np.sin(np.linspace(0, math.pi / 2, a)) ** 2
    if r > 1:
        out[-r:] *= np.cos(np.linspace(0, math.pi / 2, r)) ** 2
    return out


def mallet(midi: float, length: float = .72, bright: float = 1) -> np.ndarray:
    """Wooden tuned bar: rounded fundamental, short inharmonic attack."""
    t = clock(length)
    f = note(midi)
    out = np.sin(TAU * f * t) * np.exp(-t / .28)
    out += .22 * bright * np.sin(TAU * f * 3.98 * t) * np.exp(-t / .035)
    out += .08 * bright * np.sin(TAU * f * 9.14 * t) * np.exp(-t / .015)
    out += .09 * np.sin(TAU * f * 2 * t) * np.exp(-t / .09)
    return edges(out, .0018, .045)


def pluck(midi: float, length: float = .8) -> np.ndarray:
    """Small nylon-like pluck; upper partials decay faster than the body."""
    t = clock(length)
    f = note(midi)
    out = np.zeros(len(t))
    for harmonic in range(1, 10):
        weight = (1 / harmonic ** 1.55) * (1 if harmonic % 2 else .74)
        decay = .38 / (1 + .52 * (harmonic - 1))
        phase = TAU * f * harmonic * t + .005 * np.sin(TAU * 3.1 * t)
        out += weight * np.sin(phase) * np.exp(-t / decay)
    return edges(out, .0028, .055)


def bass(midi: float, length: float = .31) -> np.ndarray:
    t = clock(length)
    f = note(midi)
    out = (np.sin(TAU * f * t) + .3 * np.sin(TAU * 2 * f * t)
           + .12 * np.sin(TAU * 3 * f * t)) * np.exp(-t / .25)
    return edges(out, .012, .055)


def bell(midi: float, length: float = .9, brightness: float = 1) -> np.ndarray:
    """Original struck-metal timbre; no emulation or sampled game sound."""
    t = clock(length)
    f = note(midi)
    out = np.sin(TAU * f * t) * np.exp(-t / .22)
    out += .3 * brightness * np.sin(TAU * 2.76 * f * t) * np.exp(-t / .075)
    out += .13 * brightness * np.sin(TAU * 5.40 * f * t) * np.exp(-t / .028)
    out += .16 * np.sin(TAU * 2.002 * f * t) * np.exp(-t / .16)
    return edges(out, .0014, .06)


def kick() -> np.ndarray:
    t = clock(.19)
    # Gentle acoustic pulse, with enough second harmonic for tablet speakers.
    phase = TAU * (62 * t + 54 * .024 * (1 - np.exp(-t / .024)))
    out = (np.sin(phase) + .19 * np.sin(2 * phase)) * np.exp(-t / .048)
    return edges(out, .002, .024)


def rim() -> np.ndarray:
    t = clock(.1)
    out = (.55 * np.sin(TAU * 840 * t) + .22 * np.sin(TAU * 1320 * t)) * np.exp(-t / .012)
    noise = RNG.standard_normal(len(t))
    out += .08 * noise * np.exp(-t / .013)
    return edges(out, .0009, .016)


def shaker(soft: bool = False) -> np.ndarray:
    t = clock(.095 if soft else .12)
    noise = RNG.standard_normal(len(t))
    band = sosfilt(butter(2, [2600, 8000], btype="bandpass", fs=SR, output="sos"), noise)
    return edges(band * np.exp(-t / (.027 if soft else .036)), .009, .025)


class Mix:
    def __init__(self, seconds: float, loop: bool = False):
        self.pcm = np.zeros((round(seconds * SR), 2), dtype=np.float64)
        self.loop = loop

    def add(self, sound: np.ndarray, at: float, gain: float, pan: float = 0):
        # Constant-power pan, deliberately confined to a moderate stereo field.
        theta = (pan + 1) * math.pi / 4
        stereo = sound[:, None] * np.array([math.cos(theta), math.sin(theta)]) * gain
        first = round(at * SR)
        if self.loop:
            idx = (first + np.arange(len(sound))) % len(self.pcm)
            self.pcm[idx] += stereo
        else:
            start = max(0, first)
            end = min(len(self.pcm), first + len(sound))
            if end > start:
                self.pcm[start:end] += stereo[start - first:end - first]

    def room(self, amount: float = .18):
        dry = self.pcm.copy()
        for delay, gain, swap in [(.043, .33, True), (.071, .25, False),
                                  (.113, .20, True), (.179, .13, False),
                                  (.271, .08, True)]:
            frames = round(delay * SR)
            echo = dry[:, ::-1] if swap else dry
            if self.loop:
                self.pcm += np.roll(echo, frames, axis=0) * amount * gain
            else:
                self.pcm[frames:] += echo[:-frames] * amount * gain

    def master(self, peak_db: float = -3) -> np.ndarray:
        self.pcm -= np.mean(self.pcm, axis=0)
        # Gentle saturation rounds simultaneous attacks, not a loudness brickwall.
        self.pcm = np.tanh(self.pcm * .8) / .8
        peak = np.max(np.abs(self.pcm))
        self.pcm *= 10 ** (peak_db / 20) / max(peak, 1e-10)
        if not self.loop:
            self.pcm[0:128] *= np.sin(np.linspace(0, math.pi / 2, 128))[:, None] ** 2
            self.pcm[-512:] *= np.cos(np.linspace(0, math.pi / 2, 512))[:, None] ** 2
        return self.pcm


def adventure() -> np.ndarray:
    mix = Mix(LOOP_SECONDS, loop=True)
    # Original sixteen-bar melody, with answering phrases and deliberate rests.
    melody = [
        [(0, 76), (.75, 79), (1.5, 84), (3, 81), (3.5, 79)],
        [(.5, 76), (1.25, 72), (2, 74), (3, 76)],
        [(0, 77), (.75, 81), (1.5, 79), (2.75, 76)],
        [(.5, 74), (1, 79), (2.5, 76), (3.25, 74), (3.5, 71)],
        [(0, 76), (1, 79), (1.75, 81), (2.5, 84)],
        [(.25, 81), (1, 79), (2, 77), (3, 76)],
        [(.5, 74), (1.25, 77), (2, 81), (3.25, 79)],
        [(0, 74), (.75, 71), (1.5, 74), (2.5, 79), (3.5, 74)],
        [(0, 79), (.75, 84), (1.5, 88), (2.75, 84), (3.25, 81)],
        [(.5, 84), (1.25, 81), (2, 79), (3, 76)],
        [(0, 81), (.75, 84), (1.5, 86), (2.5, 84), (3.5, 81)],
        [(.25, 79), (1.25, 76), (2, 74), (3.25, 71)],
        [(0, 76), (.5, 79), (1.25, 84), (2.5, 81), (3, 79)],
        [(.5, 77), (1.25, 81), (2, 84), (3, 81)],
        [(0, 77), (.75, 74), (1.5, 77), (2.5, 81), (3.25, 79)],
        [(0, 74), (.75, 79), (1.5, 83), (2.75, 79), (3.5, 74)],
    ]
    chords = [
        (36, [60, 64, 67, 69]), (33, [60, 64, 67, 69]),
        (29, [60, 64, 65, 69]), (31, [59, 62, 67, 69]),
        (40, [60, 64, 67, 72]), (29, [60, 64, 65, 69]),
        (38, [60, 62, 65, 69]), (31, [59, 62, 67, 69]),
    ]
    for bar in range(BARS):
        base = bar * 4
        root, chord = chords[bar % len(chords)]
        # The lead's breathing space lets the game's spoken letters remain clear.
        for beat, pitch in melody[bar]:
            jitter = RNG.uniform(-.005, .005) if beat else 0
            mix.add(mallet(pitch, .85, .64), (base + beat) * BEAT + jitter,
                    .38 * RNG.uniform(.92, 1.03), -.08)
        # Light strummed chord bed, alternating inversions, never a constant drone.
        for offbeat, gain in [(.5, .065), (1.5, .08), (2.75, .065), (3.5, .078)]:
            voicing = chord if offbeat < 2 else chord[1:] + [chord[0] + 12]
            for finger, pitch in enumerate(voicing):
                mix.add(pluck(pitch, .63), (base + offbeat) * BEAT + finger * .011,
                        gain, -.30)
        for beat, pitch, accent in [(0, root, 1), (1.5, root + 12, .65),
                                    (2.5, root + 7, .78), (3.5, root + 12, .64)]:
            mix.add(bass(pitch), (base + beat) * BEAT, .38 * accent)
        for beat in [0, 2]:
            mix.add(kick(), (base + beat) * BEAT, .28)
        for beat in [1, 3]:
            mix.add(rim(), (base + beat) * BEAT + .006, .17, .19)
        for step in range(8):
            offbeat = step % 2
            mix.add(shaker(soft=not offbeat), (base + step * .5) * BEAT + (.012 if offbeat else 0),
                    .034 if not offbeat else .052, .38 if offbeat else -.32)
        # Answering high notes only in selected bars keep the loop from becoming busy.
        if bar in [1, 5, 9, 13]:
            for beat, pitch in [(2.5, chord[2] + 24), (3.5, chord[1] + 24)]:
                mix.add(bell(pitch, .9, .45), (base + beat) * BEAT, .065, .32)
        if bar in [3, 7, 11, 15]:
            for idx, pitch in enumerate([67, 69, 71]):
                mix.add(mallet(pitch, .36, .55), (base + 3 + idx * .25) * BEAT,
                        .085 + idx * .012, .25)
    mix.room(.25)
    return mix.master(-3.5)


def collect() -> np.ndarray:
    mix = Mix(.82)
    # Three bright rising strikes make an original sonic signature for discovery.
    for t, midi, gain, pan in [(0, 79, .60, -.16), (.066, 83, .65, 0), (.138, 88, .70, .16)]:
        mix.add(bell(midi, .66, .84), t, gain, pan)
    mix.room(.26)
    return mix.master(-3)


def retry() -> np.ndarray:
    mix = Mix(.60)
    # Warm low wood, descending step, clear contrast without a harsh buzzer.
    mix.add(mallet(62, .32, .28), 0, .90, -.035)
    mix.add(mallet(60, .35, .28), .18, .78, .035)
    mix.room(.12)
    return mix.master(-4)


def discovery() -> np.ndarray:
    mix = Mix(2.12)
    melody = [(0, 72), (.12, 76), (.24, 79), (.48, 84), (.72, 86), (.96, 88), (1.2, 84)]
    for index, (at, pitch) in enumerate(melody):
        mix.add(bell(pitch, .86, .56), at, .43 if index < 3 else .51, (index % 3 - 1) * .11)
    for at, chord in [(0, [48, 60, 64, 67]), (.48, [53, 60, 65, 69]), (1.2, [48, 60, 64, 67, 72])]:
        for idx, pitch in enumerate(chord):
            mix.add(pluck(pitch, .87), at + .012 * idx, .15, -.17 + idx * .075)
        mix.add(kick(), at, .16)
    mix.room(.36)
    return mix.master(-3.5)


def db(value: float) -> float:
    return round(20 * math.log10(max(float(value), 1e-12)), 4)


def stats(pcm: np.ndarray, loop: bool) -> dict:
    peak = np.max(np.abs(pcm))
    rms = np.sqrt(np.mean(pcm ** 2))
    true_peak = np.max(np.abs(resample_poly(pcm, 4, 1, axis=0)))
    mono = np.mean(pcm, axis=1)
    result = {
        "frames": len(pcm), "duration_seconds": round(len(pcm) / SR, 9),
        "sample_rate": SR, "channels": 2, "finite": bool(np.isfinite(pcm).all()),
        "sample_peak_dbfs": db(peak), "true_peak_4x_dbtp": db(true_peak),
        "rms_dbfs": db(rms), "dc_offset": float(np.max(np.abs(np.mean(pcm, axis=0)))),
        "stereo_correlation": round(float(np.corrcoef(pcm[:, 0], pcm[:, 1])[0, 1]), 5),
        "mono_rms_dbfs": db(np.sqrt(np.mean(mono ** 2))),
        "clipped_samples": int(np.count_nonzero(np.abs(pcm) >= 1)),
    }
    assert result["finite"] and result["clipped_samples"] == 0 and true_peak < 1
    if loop:
        diff = np.abs(np.diff(pcm, axis=0))
        seam = float(np.max(np.abs(pcm[0] - pcm[-1])))
        result["loop"] = {
            "bpm": BPM, "bars": BARS, "beats_per_bar": 4,
            "start_seconds": 0, "end_seconds": LOOP_SECONDS,
            "tail_handling": "circular instrument tails and short room reflections",
            "boundary_step": round(seam, 9),
            "all_steps_percentile_99": round(float(np.percentile(diff, 99)), 9),
            "boundary_step_dbfs": db(seam),
        }
        # A loop seam no larger than ordinary signal slopes should not click.
        assert seam < max(.004, float(np.percentile(diff, 99)))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--masters-dir", type=Path,
                        default=Path(tempfile.gettempdir()) / "laboratorio-expedition-audio-masters")
    args = parser.parse_args()
    args.masters_dir.mkdir(parents=True, exist_ok=True)
    out = ROOT / "public/assets/audio/expedition"
    out.mkdir(parents=True, exist_ok=True)
    report = {
        "title": "Trilha dos Descobridores", "version": 1, "seed": SEED,
        "origin": "Original score and procedural timbres for Laboratório das Letras; no third-party audio or sampled music",
        "generator": "scripts/generate-expedition-audio.py",
        "ffmpeg": subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0],
        "audition": "Technical waveform and decoded-file verification; listening on the user's tablet remains pending",
        "assets": {},
    }
    for name, render, loop in [("adventure-loop", adventure, True),
                               ("collect-chime", collect, False),
                               ("retry-cue", retry, False),
                               ("discovery-fanfare", discovery, False)]:
        pcm = render()
        metrics = stats(pcm, loop)
        wav = args.masters_dir / f"{name}.wav"
        with wave.open(str(wav), "wb") as file:
            file.setnchannels(2)
            file.setsampwidth(2)
            file.setframerate(SR)
            file.writeframes(np.round(pcm * 32767).astype("<i2").tobytes())
        destination = out / f"{name}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav),
                        "-codec:a", "libmp3lame", "-b:a", "112k" if loop else "128k",
                        "-ar", str(SR), "-map_metadata", "-1", "-write_xing", "1",
                        "-id3v2_version", "3", str(destination)], check=True)
        decoded_bytes = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(destination),
                                                "-f", "f32le", "-acodec", "pcm_f32le", "-"])
        decoded = np.frombuffer(decoded_bytes, dtype="<f4").reshape(-1, 2)
        decoded_stats = stats(decoded.astype(np.float64), loop)
        assert len(decoded) == len(pcm), "MP3 gapless trim changed the musical duration"
        metrics["decoded_mp3"] = decoded_stats
        metrics["bytes"] = destination.stat().st_size
        metrics["sha256"] = hashlib.sha256(destination.read_bytes()).hexdigest()
        metrics["pcm16_sha256"] = hashlib.sha256(wav.read_bytes()).hexdigest()
        report["assets"][str(destination.relative_to(ROOT))] = metrics
        print(f"{name}: {len(pcm) / SR:.3f}s, {metrics['bytes']} bytes, "
              f"decoded true peak {decoded_stats['true_peak_4x_dbtp']:.2f} dBTP")
    (ROOT / "docs/AUDIO_ASSETS_METRICS.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
