
const getAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return null;
  return new AudioContext();
};

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = getAudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTimeOffset: number = 0) => {
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);
  
  // Volume envelope
  gain.gain.setValueAtTime(0.05, ctx.currentTime + startTimeOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTimeOffset);
  osc.stop(ctx.currentTime + startTimeOffset + duration);
};

export const playStartListeningSound = () => {
  // Rising chime
  playTone(440, 'sine', 0.15, 0);     // A4
  playTone(880, 'sine', 0.3, 0.15);   // A5
};

export const playStopListeningSound = () => {
  // Falling chime
  playTone(880, 'sine', 0.15, 0);     // A5
  playTone(440, 'sine', 0.3, 0.15);   // A4
};

export const playSuccessSound = () => {
  // Major chord arpeggio
  playTone(523.25, 'triangle', 0.1, 0);   // C5
  playTone(659.25, 'triangle', 0.1, 0.1); // E5
  playTone(783.99, 'triangle', 0.4, 0.2); // G5
};

export const playCautionSound = () => {
  // Dissonant/Low tone
  playTone(150, 'sawtooth', 0.4, 0);
  playTone(145, 'sawtooth', 0.4, 0.1);
};
