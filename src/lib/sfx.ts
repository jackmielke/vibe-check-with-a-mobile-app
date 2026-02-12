// Web Audio API sound effects - zero latency, no API key needed

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

// Utility: play a sequence of tones
const playTones = (
  tones: { freq: number; duration: number; delay: number; type?: OscillatorType; gain?: number }[]
) => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  tones.forEach(({ freq, duration, delay, type = "sine", gain: vol = 0.3 }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + delay);
    gain.gain.setValueAtTime(vol, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + duration);
  });
};

// White noise burst (for shutter / click sounds)
const playNoiseBurst = (duration: number, volume: number = 0.15) => {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decaying noise
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  source.connect(gain).connect(ctx.destination);
  source.start();
};

// === PUBLIC SFX ===

/** Camera shutter click */
export const playShutter = () => {
  playNoiseBurst(0.08, 0.25);
  playTones([{ freq: 2000, duration: 0.05, delay: 0, type: "square", gain: 0.1 }]);
};

/** Button tap / click */
export const playTap = () => {
  playTones([{ freq: 800, duration: 0.06, delay: 0, type: "sine", gain: 0.12 }]);
};

/** Score reveal - dramatic ascending */
export const playScoreReveal = () => {
  playTones([
    { freq: 200, duration: 0.15, delay: 0, type: "sine", gain: 0.2 },
    { freq: 300, duration: 0.15, delay: 0.12, type: "sine", gain: 0.22 },
    { freq: 450, duration: 0.15, delay: 0.24, type: "sine", gain: 0.25 },
    { freq: 600, duration: 0.2, delay: 0.36, type: "sine", gain: 0.28 },
  ]);
};

/** High score celebration (score >= 75) - triumphant fanfare */
export const playHighScore = () => {
  playTones([
    { freq: 523, duration: 0.15, delay: 0, type: "square", gain: 0.2 },
    { freq: 659, duration: 0.15, delay: 0.12, type: "square", gain: 0.22 },
    { freq: 784, duration: 0.15, delay: 0.24, type: "square", gain: 0.25 },
    { freq: 1047, duration: 0.4, delay: 0.36, type: "square", gain: 0.3 },
    // Sparkle overlay
    { freq: 2000, duration: 0.1, delay: 0.5, type: "sine", gain: 0.08 },
    { freq: 2500, duration: 0.1, delay: 0.6, type: "sine", gain: 0.06 },
    { freq: 3000, duration: 0.15, delay: 0.7, type: "sine", gain: 0.05 },
  ]);
};

/** Mid score (40-74) - chill acknowledgment */
export const playMidScore = () => {
  playTones([
    { freq: 400, duration: 0.2, delay: 0, type: "triangle", gain: 0.2 },
    { freq: 500, duration: 0.2, delay: 0.15, type: "triangle", gain: 0.22 },
    { freq: 450, duration: 0.3, delay: 0.3, type: "triangle", gain: 0.18 },
  ]);
};

/** Low score (< 40) - sad descending trombone-ish */
export const playLowScore = () => {
  playTones([
    { freq: 400, duration: 0.25, delay: 0, type: "sawtooth", gain: 0.15 },
    { freq: 350, duration: 0.25, delay: 0.2, type: "sawtooth", gain: 0.13 },
    { freq: 280, duration: 0.25, delay: 0.4, type: "sawtooth", gain: 0.11 },
    { freq: 200, duration: 0.5, delay: 0.6, type: "sawtooth", gain: 0.1 },
  ]);
};

/** Success / submission confirmed */
export const playSuccess = () => {
  playTones([
    { freq: 600, duration: 0.1, delay: 0, type: "sine", gain: 0.2 },
    { freq: 800, duration: 0.15, delay: 0.08, type: "sine", gain: 0.25 },
  ]);
};

/** Play the appropriate score sound based on value */
export const playScoreSound = (score: number) => {
  playScoreReveal();
  // Delayed reaction sound after the reveal buildup
  setTimeout(() => {
    if (score >= 75) playHighScore();
    else if (score >= 40) playMidScore();
    else playLowScore();
  }, 600);
};
