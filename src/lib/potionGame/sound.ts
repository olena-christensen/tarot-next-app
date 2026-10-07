/**
 * "Brew the Potion" sound (Lena, 2026-10-07): one Web Audio graph, so the
 * boiling in the background, the found-item sounds and the boil-over blend
 * smoothly instead of starting and stopping on top of each other.
 *
 *   bed (cauldron-boil-loop.mp3, gapless loop) ─┐
 *     calm layer   rate 1.00                    │
 *     hot layer    rate 1.18 (last 20 s)        ├─ duck ─ bedOut ─┐
 *     rumble layer rate 0.70, low-passed        ┘                 ├─ master (mute) ─ speakers
 *   found / bubble / boil-over / laugh ───────────────────────────┘
 *
 * Browsers only start audio after a tap, so `unlock()` is called on the first
 * pointer-down; a bed asked for earlier starts then.
 */

const FILES = {
  bed: "/sounds/cauldron-boil-loop.mp3",
  found: "/sounds/magic-found.mp3",
  bubble: "/sounds/cauldron-bubble.mp3",
  boil: "/sounds/cauldron-boil-over.mp3",
  laugh: "/sounds/witch-laugh.mp3",
} as const;
type SoundName = keyof typeof FILES;

/** The loop file has 1 s of run-in on each side; the seamless loop is 1 s → 25 s. */
const BED_LOOP = { start: 1, end: 25 };
const CALM = 0.35;
const HOT_CALM = 0;
const HOT_FAST = 0.6;
const HOT_RUMBLE = 0.5;

const MUTE_KEY = "potion-sound";

export function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "off";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean) {
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "off");
    else window.localStorage.removeItem(MUTE_KEY);
  } catch {
    // Private window or blocked storage: the choice lasts for this visit only.
  }
}

type Bed = {
  sources: AudioBufferSourceNode[];
  calm: GainNode;
  fast: GainNode;
  rumble: GainNode;
  duck: GainNode;
  out: GainNode;
};

export class PotionSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<SoundName, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private bed: Bed | null = null;
  private wantBed = false;
  private hot = false;
  private muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  /** Call from a tap. Creates the audio graph the first time and loads the sounds. */
  unlock() {
    if (!this.ctx) {
      const Ctx =
        typeof window !== "undefined"
          ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
      if (!Ctx) return; // very old browser: the game just plays silently
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.loading = this.load();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.wantBed && !this.bed) void this.loading?.then(() => this.wantBed && !this.bed && this.startBedNow());
  }

  private async load() {
    const ctx = this.ctx!;
    await Promise.all(
      (Object.keys(FILES) as SoundName[]).map(async (name) => {
        try {
          const res = await fetch(FILES[name]);
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(name, buf);
        } catch {
          // A missing sound is silent, never an error in the game.
        }
      }),
    );
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    saveMuted(muted);
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  /** One-shot sound. `delay` in seconds. */
  play(name: Exclude<SoundName, "bed">, gain: number, delay = 0) {
    const ctx = this.ctx;
    const buf = this.buffers.get(name);
    if (!ctx || !this.master || !buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.master);
    src.start(ctx.currentTime + delay);
  }

  /** An ingredient lands: its sounds play and the boiling dips under them. */
  found() {
    this.play("found", 0.7);
    this.play("bubble", 0.6, 0.9);
    const ctx = this.ctx;
    const duck = this.bed?.duck;
    if (!ctx || !duck) return;
    const t = ctx.currentTime;
    duck.gain.cancelScheduledValues(t);
    duck.gain.setTargetAtTime(0.6, t, 0.08);
    duck.gain.setTargetAtTime(1, t + 1.5, 0.35);
  }

  /** A new round: fresh calm boiling (starts at the first tap if audio is still locked). */
  startBed() {
    this.stopBed(0.4);
    this.wantBed = true;
    this.hot = false;
    if (this.ctx && this.ctx.state === "running" && this.buffers.has("bed")) this.startBedNow();
    else this.unlockedLater();
  }

  private unlockedLater() {
    // Already unlocked but still loading: start once the files are in.
    if (this.ctx && this.loading) void this.loading.then(() => this.wantBed && !this.bed && this.startBedNow());
  }

  private startBedNow() {
    const ctx = this.ctx;
    const buf = this.buffers.get("bed");
    if (!ctx || !this.master || !buf || this.bed) return;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(1, t + 1.2); // fade in, never a hard start
    const duck = ctx.createGain();
    duck.connect(out).connect(this.master);
    const layer = (rate: number, gain: number, lowpass?: number) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = BED_LOOP.start;
      src.loopEnd = BED_LOOP.end;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = gain;
      if (lowpass) {
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = lowpass;
        src.connect(f).connect(g);
      } else {
        src.connect(g);
      }
      g.connect(duck);
      src.start(t, BED_LOOP.start + Math.random() * 20); // each layer from its own spot
      return { src, g };
    };
    const calm = layer(1, this.hot ? HOT_CALM : CALM);
    const fast = layer(1.18, this.hot ? HOT_FAST : 0);
    const rumble = layer(0.7, this.hot ? HOT_RUMBLE : 0, 400);
    this.bed = {
      sources: [calm.src, fast.src, rumble.src],
      calm: calm.g,
      fast: fast.g,
      rumble: rumble.g,
      duck,
      out,
    };
  }

  /** The last 20 seconds: faster, louder boiling and a low rumble, eased in over ~3 s. */
  setHot(hot: boolean) {
    this.hot = hot;
    const ctx = this.ctx;
    const bed = this.bed;
    if (!ctx || !bed) return;
    const t = ctx.currentTime;
    bed.calm.gain.setTargetAtTime(hot ? HOT_CALM : CALM, t, 1);
    bed.fast.gain.setTargetAtTime(hot ? HOT_FAST : 0, t, 1);
    bed.rumble.gain.setTargetAtTime(hot ? HOT_RUMBLE : 0, t, 1);
  }

  /** Fade the boiling out (potion brewed, or a new round). */
  stopBed(fade = 1.2) {
    this.wantBed = false;
    const ctx = this.ctx;
    const bed = this.bed;
    this.bed = null;
    if (!ctx || !bed) return;
    const t = ctx.currentTime;
    bed.out.gain.cancelScheduledValues(t);
    bed.out.gain.setValueAtTime(bed.out.gain.value, t);
    bed.out.gain.linearRampToValueAtTime(0, t + fade);
    bed.sources.forEach((s) => s.stop(t + fade + 0.05));
  }

  /** Time's up: the boiling swells straight into the boil-over, then fades under it. */
  boilOver() {
    const ctx = this.ctx;
    const bed = this.bed;
    if (ctx && bed) {
      const t = ctx.currentTime;
      bed.out.gain.cancelScheduledValues(t);
      bed.out.gain.setValueAtTime(bed.out.gain.value, t);
      bed.out.gain.linearRampToValueAtTime(1.6, t + 0.4);
      bed.out.gain.linearRampToValueAtTime(0, t + 3);
      bed.sources.forEach((s) => s.stop(t + 3.1));
      this.bed = null;
    }
    this.wantBed = false;
    this.play("boil", 0.8); // 5.5 s
    this.play("laugh", 0.8, 1.5); // 6 s, runs on under the card
  }

  dispose() {
    this.stopBed(0.2);
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx) window.setTimeout(() => void ctx.close(), 300);
  }
}
