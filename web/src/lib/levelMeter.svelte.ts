// Cosmetic per-channel activity meter. It is not a real audio level: each
// NoteOn kicks the bar to velocity x Vol x Exp and the bar decays over
// time. That is enough for a visual cue without touching the WASM core.

import {
  channelKey,
  CHANNELS_PER_PORT,
  MAX_CHANNELS,
  type ChannelState,
} from './channelState';

// Time for a bar to fall to 1/e of its value. Long enough that notes from
// batched log deliveries (~tens of ms apart) read as continuous motion.
const DECAY_SECS = 0.35;
const FLOOR = 0.005;

export class LevelMeter {
  levels = $state<number[]>(new Array(MAX_CHANNELS).fill(0));

  #frame = 0;
  #lastTs = 0;

  hit(state: ChannelState, velocity: number): void {
    if (state.channel >= CHANNELS_PER_PORT) return;
    const key = channelKey(state.port, state.channel);
    if (key >= MAX_CHANNELS) return;
    const amount = (velocity / 127) * (state.volume / 127) * (state.expression / 127);
    // sqrt lifts quiet channels so moderate mixes still produce visible bars.
    const level = Math.sqrt(amount);
    if (level > this.levels[key]) this.levels[key] = level;
    this.#start();
  }

  reset(): void {
    this.#stop();
    this.levels = new Array(MAX_CHANNELS).fill(0);
  }

  #start(): void {
    if (this.#frame !== 0) return;
    this.#lastTs = performance.now();
    this.#frame = requestAnimationFrame(this.#tick);
  }

  #stop(): void {
    if (this.#frame !== 0) cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #tick = (ts: number): void => {
    const factor = Math.exp(-(ts - this.#lastTs) / 1000 / DECAY_SECS);
    this.#lastTs = ts;
    let active = false;
    for (let i = 0; i < this.levels.length; i++) {
      const v = this.levels[i];
      if (v === 0) continue;
      const next = v * factor;
      this.levels[i] = next < FLOOR ? 0 : next;
      if (next >= FLOOR) active = true;
    }
    // Park the loop once every bar has settled so an idle player costs nothing.
    this.#frame = active ? requestAnimationFrame(this.#tick) : 0;
  };
}
