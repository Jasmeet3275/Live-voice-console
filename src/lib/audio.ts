/** Deterministic pseudo-random in [0,1) from a seed — stable waveforms per call. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generate a credible speech-like amplitude envelope (values 0–1). */
export function generateWaveform(bars = 72, seed = 42): number[] {
  const rand = mulberry32(seed)
  const out: number[] = []
  for (let i = 0; i < bars; i++) {
    // syllable-like cadence + jitter, with occasional quiet gaps
    const cadence = (Math.sin(i * 0.55) + 1) / 2
    const jitter = rand()
    const gap = rand() < 0.12 ? 0.15 : 1
    const v = (cadence * 0.6 + jitter * 0.4) * gap
    out.push(Math.max(0.06, Math.min(1, v)))
  }
  return out
}

/** Sample the amplitude at a normalized position (0–1) along the waveform. */
export function sampleLevel(data: number[], fraction: number): number {
  if (data.length === 0) return 0
  const idx = Math.min(
    data.length - 1,
    Math.max(0, Math.floor(fraction * data.length)),
  )
  return data[idx]
}

/** Format seconds as m:ss for playback readouts. */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
