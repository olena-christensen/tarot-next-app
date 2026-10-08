"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { ShareDialog } from "@/components/ShareDialog";
import { useOpenLogin } from "@/components/LoginContext";
import { makePotionGif } from "@/lib/potionGame/potionGif";
import { saveClaim, takeClaim } from "@/lib/potionGame/claim";
import { PotionSound, readMuted } from "@/lib/potionGame/sound";
import type { PotionProgress } from "@/lib/potionGame/reward";
import { notifyMoonstonesChanged } from "@/lib/moonstones";
import Skull from "@/assets/svg/skull.svg";
import Ouroboros from "@/assets/svg/ouroboros.svg";
import { MoonstoneProgress, PotionMoonRow } from "@/components/PotionMoonRow";
import {
  CAULDRON,
  WORLD,
  generateRound,
  cleanBrewerName,
  encodeGift,
  hits,
  POTIONS_PER_MOONSTONE,
  ROUND_TIME_MS,
  ROUND_WARN_MS,
  potionOf,
  spritePath,
  type Placement,
  type Round,
} from "@/lib/potionGame";

/**
 * "Brew the Potion": find the recipe's ingredients hidden in the witch's room.
 *
 * The room is a fixed 1536×1024 "world" drawn inside a viewport that can be
 * pinched and dragged (phones) — taps are converted back to world pixels and
 * tested against each ingredient's tap box. Every hidden ingredient is a
 * pre-rendered patch (see scripts/build-potion-art.py) laid over the room.
 */

const FLY_MS = 900; // tap → lands in the cauldron
/** Where the boil-over spill sits in the room (scripts/build-boil-steam.py, SPILL_BOX). */
const SPILL_BOX = { x: 590, y: 640, w: 410, h: 320 };
const STEAM_WISPS = 4;
/**
 * Candle flames that flicker (Lena, 2026-10-07): [x, y, w, h] in room pixels,
 * printed by scripts/build-candle-flames.py. Each has a still "cover" (the
 * painted flame removed) and the live flame on top; plus the lantern's glow.
 */
const CANDLES: [number, number, number, number][] = [
  [807, 196, 46, 56],
  [415, 438, 48, 58],
  [475, 504, 36, 40],
  [1311, 552, 38, 44],
  [117, 768, 46, 56],
];
const LANTERN = { x: 1416, y: 480 };
/** Longest the game waits for its sounds before starting without them. */
const SOUND_WAIT_MS = 4000;
const WRONG_WINDOW_MS = 2000;
const WRONG_LIMIT = 3;
const BLUR_MS = 5000;
const MAX_ZOOM = 3;
/** Phones (portrait, or landscape with little height): the game takes the whole screen. */
const FULL_SCREEN_QUERY = "(max-width: 48em), (max-height: 500px)";

type View = { s: number; tx: number; ty: number; min: number };

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const BrewPotionGame = () => {
  const t = useTranslations("game");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const openLogin = useOpenLogin();

  // A round is random, so it's created on the client only (no SSR mismatch).
  const [round, setRound] = useState<Round | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set()); // tapped
  const [landed, setLanded] = useState<Set<number>>(new Set()); // in the cauldron
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintTarget, setHintTarget] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [blurredUntil, setBlurredUntil] = useState(0);
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState<View>({ s: 1, tx: 0, ty: 0, min: 1 });
  const [fullScreen, setFullScreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const finishedRef = useRef(false);
  // Moonstones: the server times each round; null until it has answered.
  const [moon, setMoon] = useState<PotionProgress | null>(null);
  const roundIdRef = useRef<Promise<string | null>>(Promise.resolve(null));
  const [roundId, setRoundId] = useState<string | null>(null);
  // Keep it or send it (Lena, 2026-10-07): nothing counts until the player chooses.
  const [decision, setDecision] = useState<"kept" | "sent" | null>(null);
  // The sand clock ran out (Lena, 2026-10-06): the potion boils over, then the
  // "boiled over" card. Nothing is sent to the server, so nothing counts.
  const [boiledAt, setBoiledAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [quaking, setQuaking] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const wrongTaps = useRef<number[]>([]);
  const timers = useRef({ list: [] as number[] });
  // Boiling in the background, found sounds, boil-over — all blended (sound.ts).
  const sound = useRef<PotionSound | null>(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.list.push(window.setTimeout(fn, ms));
  };

  const startRound = useCallback(() => {
    timers.current.list.forEach(clearTimeout);
    timers.current.list = [];
    setRound(generateRound());
    sound.current?.startBed();
    setFound(new Set());
    setLanded(new Set());
    setFinishedAt(null);
    setHintUsed(false);
    setHintTarget(null);
    setBlurredUntil(0);
    setMoon(null);
    setDecision(null);
    setRoundId(null);
    setBoiledAt(null);
    setFailed(false);
    setQuaking(false);
    fxRef.current?.replaceChildren(); // the boil-over effects from the last round
    wrongTaps.current = [];
    const pending = fetch("/api/game/round", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { roundId?: string } | null) => d?.roundId ?? null)
      .catch(() => null); // offline: the game still plays, it just doesn't count
    roundIdRef.current = pending;
    pending.then((id) => {
      if (roundIdRef.current === pending) setRoundId(id);
    });
    const start = Date.now();
    setStartedAt(start);
    setNow(start);
    track("potion_started");
  }, []);

  useEffect(() => {
    const m = readMuted();
    setMuted(m);
    const engine = new PotionSound(m);
    sound.current = engine;
    engine.unlock(); // allowed straight away when the player came through the site's own link
    // The ouroboros spins until the room picture (and, briefly, the sounds) are
    // in; only then does the clock start and the boiling begin (Lena, 2026-10-07).
    let cancelled = false;
    const room = new Image();
    const roomReady = new Promise<void>((resolve) => {
      room.onload = room.onerror = () => resolve();
      room.src = "/game-art/potion/room.webp";
    });
    const soundsReady = Promise.race([
      engine.whenLoaded(),
      new Promise<void>((resolve) => window.setTimeout(resolve, SOUND_WAIT_MS)),
    ]);
    Promise.all([roomReady, soundsReady]).then(() => {
      if (cancelled) return;
      setReady(true);
      startRound();
    });
    const pending = timers.current;
    return () => {
      cancelled = true;
      pending.list.forEach(clearTimeout);
      engine.dispose();
      sound.current = null;
    };
  }, [startRound]);

  // Timer ticks while playing.
  useEffect(() => {
    if (!round || finishedAt || boiledAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [round, finishedAt, boiledAt]);

  // ---------- viewport: fit, clamp, pinch, drag ----------
  const clamp = useCallback((v: View): View => {
    const el = stageRef.current;
    if (!el) return v;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const s = Math.min(Math.max(v.s, v.min), v.min * MAX_ZOOM);
    const tx = Math.min(0, Math.max(cw - WORLD.width * s, v.tx));
    const ty = Math.min(0, Math.max(ch - WORLD.height * s, v.ty));
    return { ...v, s, tx, ty };
  }, []);

  const fit = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    // "Cover": the room always fills the frame; on a phone that means the
    // sides start off-screen and the view opens centred on the cauldron.
    const min = Math.max(cw / WORLD.width, ch / WORLD.height);
    setView(clamp({ s: min, min, tx: cw / 2 - CAULDRON.x * min, ty: ch - WORLD.height * min }));
  }, [clamp]);

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit, fullScreen]);

  // ---------- phones: whole screen, no page scroll, no accidental exits ----------
  useEffect(() => {
    const mq = window.matchMedia(FULL_SCREEN_QUERY);
    const update = () => setFullScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    finishedRef.current = finishedAt !== null || failed;
  }, [finishedAt, failed]);

  useEffect(() => {
    if (!fullScreen) return;
    const root = document.documentElement;
    root.classList.add("potion-locked");
    // A swipe-back (or the back button) while playing lands on this extra
    // entry and is put straight back — only the ✕ button leaves the game.
    // Once the potion is brewed, back works normally.
    window.history.pushState({ potionGuard: true }, "");
    const onPop = () => {
      if (!finishedRef.current) window.history.pushState({ potionGuard: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => {
      root.classList.remove("potion-locked");
      window.removeEventListener("popstate", onPop);
    };
  }, [fullScreen]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    moved: boolean;
    startX: number;
    startY: number;
    startDist: number;
    startView: View;
    midX: number;
    midY: number;
  } | null>(null);

  const localPoint = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const beginGesture = () => {
    const pts = Array.from(pointers.current.values());
    const [a, b] = pts;
    gesture.current = {
      moved: gesture.current?.moved ?? false,
      startX: a.x,
      startY: a.y,
      startDist: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
      startView: view,
      midX: b ? (a.x + b.x) / 2 : a.x,
      midY: b ? (a.y + b.y) / 2 : a.y,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (finishedAt || boiledAt) return; // the end card's buttons need their own clicks
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, localPoint(e));
    if (pointers.current.size === 1) gesture.current = null;
    beginGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, localPoint(e));
    const g = gesture.current;
    const pts = Array.from(pointers.current.values());
    if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const s = g.startView.s * (dist / (g.startDist || dist));
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Keep the world point under the fingers' midpoint where it was.
      const wx = (g.midX - g.startView.tx) / g.startView.s;
      const wy = (g.midY - g.startView.ty) / g.startView.s;
      g.moved = true;
      setView(clamp({ ...g.startView, s, tx: mx - wx * s, ty: my - wy * s }));
      setTouched(true);
    } else {
      const dx = pts[0].x - g.startX;
      const dy = pts[0].y - g.startY;
      if (!g.moved && Math.hypot(dx, dy) < 8) return;
      g.moved = true;
      setView(clamp({ ...g.startView, tx: g.startView.tx + dx, ty: g.startView.ty + dy }));
      setTouched(true);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasTap =
      pointers.current.size === 1 && gesture.current && !gesture.current.moved;
    const p = localPoint(e);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      beginGesture(); // one finger lifted mid-pinch: continue as a drag
      return;
    }
    gesture.current = null;
    if (wasTap) handleTap(p.x, p.y);
  };

  // ---------- taps ----------
  const handleTap = (sx: number, sy: number) => {
    if (!round || finishedAt || boiledAt) return;
    if (Date.now() < blurredUntil) return;
    const wx = (sx - view.tx) / view.s;
    const wy = (sy - view.ty) / view.s;
    const pad = Math.max(8, 14 / view.s); // at least ~14 screen px around small items
    const idx = round.placements.findIndex((p, i) => !found.has(i) && hits(p, wx, wy, pad));
    if (idx === -1) return wrongTap();
    collect(idx, wx, wy);
  };

  const wrongTap = () => {
    setShaking(true);
    later(() => setShaking(false), 400);
    const ts = Date.now();
    wrongTaps.current = [...wrongTaps.current.filter((x) => ts - x < WRONG_WINDOW_MS), ts];
    if (wrongTaps.current.length >= WRONG_LIMIT) {
      wrongTaps.current = [];
      setBlurredUntil(ts + BLUR_MS);
      later(() => setBlurredUntil(0), BLUR_MS);
    }
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sound.current?.setMuted(next);
  };

  const collect = (idx: number, tapX: number, tapY: number) => {
    if (!round) return;
    const p = round.placements[idx];
    const next = new Set(found).add(idx);
    setFound(next);
    if (hintTarget === idx) setHintTarget(null);
    sound.current?.found(); // twinkle now, bubbling as it lands
    animateCollect(p, tapX, tapY);

    const done = next.size === round.placements.length;
    const tappedAt = Date.now();
    later(() => {
      setLanded((prev) => new Set(prev).add(idx));
      cauldronBurst();
    }, FLY_MS);
    if (done) {
      sound.current?.stopBed(1.2 + FLY_MS / 1000);
      finishOnServer();
      later(() => {
        setFinishedAt(tappedAt);
        track("potion_finished", { seconds: Math.round((tappedAt - startedAt) / 1000) });
      }, FLY_MS + 700);
    }
  };

  // ---------- moonstones ----------
  const applyProgress = (p: PotionProgress | undefined) => {
    if (!p) return;
    setMoon(p);
    if (p.justRewarded) notifyMoonstonesChanged();
  };

  const finishOnServer = async () => {
    const roundId = await roundIdRef.current;
    if (!roundId) return;
    try {
      const res = await fetch("/api/game/round/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      const data = (await res.json()) as { progress?: PotionProgress };
      applyProgress(data.progress);
    } catch {
      // No progress box this time; the potion itself is unaffected.
    }
  };

  // Signed in (here, or back from Google): bring back the end screen the claim
  // was made from, and let the server move today's potions to the account.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const claim = takeClaim();
    if (claim) {
      timers.current.list.forEach(clearTimeout);
      const all = new Set(claim.round.placements.map((_, i) => i));
      setRound(claim.round);
      setFound(all);
      setLanded(all);
      setStartedAt(claim.startedAt);
      setFinishedAt(claim.finishedAt);
      setNow(claim.finishedAt);
      setDecision(claim.decision ?? "kept");
      setRoundId(claim.roundId ?? null);
      roundIdRef.current = Promise.resolve(claim.roundId ?? null);
    }
    fetch("/api/game/progress", { method: "POST" })
      .then((r) => r.json())
      .then((d: { progress?: PotionProgress }) => applyProgress(d.progress))
      .catch(() => {});
  }, [authStatus]);

  const signInToClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    if (round && finishedAt) saveClaim({ round, startedAt, finishedAt, decision, roundId });
    openLogin();
  };

  const decide = (outcome: "kept" | "sent", opts: { keepalive?: boolean } = {}) => {
    if (!roundId || decision) return;
    setDecision(outcome);
    if (outcome === "kept" && moon) setMoon({ ...moon, today: moon.today + 1 }); // the server confirms below
    fetch("/api/game/round/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, outcome }),
      keepalive: opts.keepalive,
    })
      .then((r) => r.json())
      .then((d: { progress?: PotionProgress }) => applyProgress(d.progress))
      .catch(() => {});
  };

  // ---------- effects (Web Animations, in world coordinates) ----------
  const spawn = (cls: string, x: number, y: number, w: number, h: number) => {
    const el = document.createElement("div");
    el.className = cls;
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    fxRef.current?.appendChild(el);
    return el;
  };

  const animateCollect = (p: Placement, tapX: number, tapY: number) => {
    const ring = spawn("potion-fx__ring", tapX - 10, tapY - 10, 20, 20);
    ring.animate(
      [{ opacity: 1, transform: "scale(.5)" }, { opacity: 0, transform: "scale(5)" }],
      { duration: 600, easing: "ease-out" },
    ).onfinish = () => ring.remove();

    const [hx, hy, hw, hh] = p.hit;
    const size = Math.max(hw, hh);
    const fly = document.createElement("img");
    fly.src = spritePath(p.ingredient);
    fly.alt = "";
    fly.className = "potion-fx__fly";
    fly.style.cssText = `left:${hx + hw / 2 - size / 2}px;top:${hy + hh / 2 - size / 2}px;width:${size}px;height:${size}px`;
    fxRef.current?.appendChild(fly);
    const dx = CAULDRON.x - (hx + hw / 2);
    const dy = CAULDRON.y - (hy + hh / 2);
    const lift = Math.min(dy, 0) - 140; // arc over, then drop in
    fly.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", filter: "drop-shadow(0 0 0 #ffe9a8)" },
        { transform: "translate(0,0) scale(1.35) rotate(0deg)", filter: "drop-shadow(0 0 14px #ffe9a8)", offset: 0.22 },
        { transform: `translate(${dx * 0.55}px,${lift}px) scale(1.1) rotate(-160deg)`, offset: 0.6 },
        { transform: `translate(${dx}px,${dy}px) scale(.2) rotate(-360deg)`, opacity: 0.2 },
      ],
      { duration: FLY_MS, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" },
    ).onfinish = () => fly.remove();
  };

  const cauldronBurst = () => {
    const { x, y } = CAULDRON;
    const flash = spawn("potion-fx__flash", x - 190, y - 40, 380, 120);
    flash.animate(
      [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, offset: 0.25 }, { opacity: 0, transform: "scale(1.4)" }],
      { duration: 700, easing: "ease-out" },
    ).onfinish = () => flash.remove();

    const puff = spawn("potion-fx__puff", x - 130, y - 250, 260, 290);
    puff.animate(
      [
        { opacity: 0, transform: "translateY(90px) scale(.4)" },
        { opacity: 1, offset: 0.25 },
        { opacity: 0, transform: "translateY(-140px) scale(1.8)" },
      ],
      { duration: 1400, easing: "ease-out" },
    ).onfinish = () => puff.remove();

    for (let i = 0; i < 14; i++) {
      const sz = 10 + Math.random() * 24;
      const b = spawn("potion-fx__bubble", x - 110 + Math.random() * 220, y - 10, sz, sz);
      const rise = 90 + Math.random() * 190;
      b.animate(
        [
          { opacity: 0, transform: "translateY(0) scale(.3)" },
          { opacity: 1, transform: `translateY(${-rise * 0.3}px) scale(1)`, offset: 0.2 },
          { opacity: 0, transform: `translateY(${-rise}px) scale(1.2)` },
        ],
        { duration: 1100, delay: Math.random() * 500, easing: "ease-out", fill: "both" },
      ).onfinish = () => b.remove();
    }
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI - Math.PI;
      const r = 100 + Math.random() * 140;
      const s = spawn("potion-fx__spark", x - 5, y - 5, 10, 10);
      s.animate(
        [
          { opacity: 1, transform: "translate(0,0) scale(1)" },
          { opacity: 0, transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.3)` },
        ],
        { duration: 900, delay: Math.random() * 150, easing: "ease-out", fill: "both" },
      ).onfinish = () => s.remove();
    }
  };

  // ---------- the sand clock runs out: the potion boils over ----------
  const spill = () => {
    // No foam (Lena, 2026-10-07): green light overflows the rim and runs down
    // the pot, the surface flares, and steam ribbons like the room's own surge
    // up. Art: scripts/build-boil-steam.py.
    const { x, y } = CAULDRON;
    const flare = spawn("potion-fx__flash potion-fx__flash--boil", x - 230, y - 70, 460, 150);
    flare.animate(
      [
        { opacity: 0, transform: "scale(.7)" },
        { opacity: 1, transform: "scale(1.05)", offset: 0.15 },
        { opacity: 0.6, transform: "scale(.95)", offset: 0.35 },
        { opacity: 1, transform: "scale(1.1)", offset: 0.55 },
        { opacity: 0.7, offset: 0.8 },
        { opacity: 0.5, transform: "scale(1)" },
      ],
      { duration: 4500, easing: "ease-in-out", fill: "forwards" },
    );

    const runDown = document.createElement("img");
    runDown.src = "/game-art/potion/cauldron-spill.webp";
    runDown.alt = "";
    runDown.className = "potion-fx__spill";
    runDown.style.cssText = `left:${SPILL_BOX.x}px;top:${SPILL_BOX.y}px;width:${SPILL_BOX.w}px;height:${SPILL_BOX.h}px`;
    fxRef.current?.appendChild(runDown);
    runDown.animate(
      [
        { opacity: 0, clipPath: "inset(0 0 88% 0)" },
        { opacity: 1, clipPath: "inset(0 0 80% 0)", offset: 0.12 },
        { opacity: 1, clipPath: "inset(0 0 0 0)" },
      ],
      { duration: 2600, delay: 700, easing: "cubic-bezier(.5,0,.6,1)", fill: "both" },
    ).onfinish = () => {
      // Still shimmering while the card comes up.
      runDown.animate([{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }], {
        duration: 1100,
        iterations: Infinity,
        easing: "ease-in-out",
      });
    };

    for (let i = 0; i < 12; i++) {
      const wisp = document.createElement("img");
      wisp.src = `/game-art/potion/steam-wisp-${(i % STEAM_WISPS) + 1}.webp`;
      wisp.alt = "";
      wisp.className = "potion-fx__wisp";
      wisp.style.cssText = `left:${x - 110 + (Math.random() - 0.5) * 300}px;top:${y - 500}px;width:220px;height:520px`;
      fxRef.current?.appendChild(wisp);
      const flip = Math.random() < 0.5 ? -1 : 1;
      const sway = (Math.random() - 0.5) * 24;
      const sz = 0.7 + Math.random() * 0.6;
      wisp.animate(
        [
          { opacity: 0, transform: `translateY(80px) scale(${flip * sz * 0.6}, ${sz * 0.4}) rotate(0deg)` },
          { opacity: 1, transform: `translateY(0) scale(${flip * sz}, ${sz}) rotate(${sway / 2}deg)`, offset: 0.35 },
          { opacity: 0, transform: `translateY(-260px) scale(${flip * sz * 1.15}, ${sz * 1.3}) rotate(${sway}deg)` },
        ],
        { duration: 2600 + Math.random() * 900, delay: 300 + i * 330, easing: "ease-out", fill: "both" },
      ).onfinish = () => wisp.remove();
    }
    // Violent bubbling for the first four seconds.
    for (let k = 0; k < 17; k++) later(() => simmer(6, true), k * 250);
  };

  // Bubbles popping out of the cauldron; more of them = harder boiling.
  const simmer = (count: number, big = false) => {
    const { x, y } = CAULDRON;
    for (let i = 0; i < count; i++) {
      const sz = (big ? 12 : 8) + Math.random() * (big ? 26 : 18);
      const b = spawn("potion-fx__bubble", x - 150 + Math.random() * 300, y - 20, sz, sz);
      const rise = 60 + Math.random() * (big ? 240 : 150);
      b.animate(
        [
          { opacity: 0, transform: "translateY(0) scale(.3)" },
          { opacity: 1, transform: `translateY(${-rise * 0.3}px) scale(1)`, offset: 0.2 },
          { opacity: 0, transform: `translateY(${-rise}px) scale(1.2)` },
        ],
        { duration: 900, delay: Math.random() * 400, easing: "ease-out", fill: "both" },
      ).onfinish = () => b.remove();
    }
  };

  const boilOver = () => {
    if (!round) return;
    setBoiledAt(Date.now());
    setHintTarget(null);
    track("potion_boiled_over", { found: found.size });
    sound.current?.boilOver(); // the boiling swells into the boil-over, then the laugh
    setQuaking(true);
    later(() => setQuaking(false), 3600);
    spill();
    later(() => setFailed(true), 5000);
  };

  const timeLeft = Math.max(0, ROUND_TIME_MS - ((boiledAt ?? now) - startedAt));
  const playing = !!round && !finishedAt && !boiledAt;
  const hot = playing && timeLeft <= ROUND_WARN_MS;

  // Time's up with things still to find (the last tap still flying is fine).
  useEffect(() => {
    if (playing && startedAt && timeLeft <= 0 && found.size < (round?.placements.length ?? 0)) boilOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, timeLeft]);

  // The last stretch sounds harder.
  useEffect(() => {
    sound.current?.setHot(hot);
  }, [hot]);

  // The cauldron bubbles the whole round (Lena, 2026-10-07): gentle at the
  // start, building up, and at full strength in the last 20 seconds.
  const boilLevel = useRef(0);
  boilLevel.current = hot ? 1 : Math.min(0.75, (0.75 * (ROUND_TIME_MS - timeLeft)) / (ROUND_TIME_MS - ROUND_WARN_MS));
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      const level = boilLevel.current;
      simmer(Math.max(1, Math.round(1 + level * 3)), level > 0.75);
      id = window.setTimeout(tick, 900 - level * 300);
    };
    tick();
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // ---------- hint ----------
  const takeHint = () => {
    if (!round || hintUsed || finishedAt || boiledAt) return;
    const left = round.placements.map((_, i) => i).filter((i) => !found.has(i));
    if (!left.length) return;
    const idx = left[Math.floor(Math.random() * left.length)];
    setHintUsed(true);
    setHintTarget(idx);
    later(() => setHintTarget((cur) => (cur === idx ? null : cur)), 4000);
    // Zoomed in on a phone: bring the hinted spot into view.
    const el = stageRef.current;
    if (el && view.s > view.min + 0.001) {
      const [hx, hy, hw, hh] = round.placements[idx].hit;
      setView(
        clamp({
          ...view,
          tx: el.clientWidth / 2 - (hx + hw / 2) * view.s,
          ty: el.clientHeight / 2 - (hy + hh / 2) * view.s,
        }),
      );
    }
  };

  // ---------- derived ----------
  const progress = useMemo(() => {
    if (!round) return [];
    return round.recipe.map((line) => ({
      ...line,
      got: round.placements.filter((p, i) => p.ingredient === line.ingredient && landed.has(i)).length,
    }));
  }, [round, landed]);

  const elapsed = (finishedAt ?? now) - startedAt;
  const blurred = blurredUntil > 0;
  const total = round?.placements.length ?? 0;
  const hintPlacement = hintTarget !== null && round ? round.placements[hintTarget] : null;

  // ---------- the brewed potion and sharing it ----------
  const potion = round ? potionOf(round.recipe) : null;
  const potionName = potion ? t(`potionNames.${potion}`) : "";

  const giftUrl = useMemo(() => {
    if (!potion || !round || typeof window === "undefined") return "";
    const code = encodeGift({ potion, from: cleanBrewerName(session?.user?.name), round: roundId });
    // No language in the link: it opens in the friend's own language (their
    // saved preference, else their phone's), not the brewer's.
    return `${window.location.origin}/potion/${code}`;
  }, [potion, round, roundId, session?.user?.name]); // round: a fresh link per brew

  // The animated picture — offered only as a download on computers. Phones
  // share the LINK alone: messengers turn it into a card whose picture IS the
  // link (tap → the potion page). Sending the picture as a file made a tap
  // open the picture instead (Lena, 2026-10-06).
  const brewerName = cleanBrewerName(session?.user?.name);
  const [gif, setGif] = useState<{ file: File; url: string } | null>(null);
  // Plain strings as dependencies (not `t`), so a re-render never restarts the work.
  const gifFrom = brewerName ? t("giftCardFrom", { name: brewerName }) : t("giftCardAnon");
  const gifButton = t("gifButton");
  useEffect(() => {
    if (!finishedAt || !potionName) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let cancelled = false;
    let url = "";
    makePotionGif({ from: gifFrom, potion: potionName, button: gifButton, site: "theveil.app" })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setGif({ file: new File([blob], "potion.gif", { type: "image/gif" }), url });
      })
      .catch(() => {
        // No picture — sharing falls back to the link alone.
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setGif(null);
    };
  }, [finishedAt, potionName, gifFrom, gifButton]);

  const sendToFriend = async () => {
    if (!giftUrl) return;
    track("potion_shared");
    // Phones: the phone's own share menu (Messenger, WhatsApp, Slack, Instagram…).
    // Computers: our dialog — Facebook, Slack (copy), Telegram, WhatsApp, copy link.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && navigator.share) {
      try {
        // The link alone (Lena, 2026-10-07): a message text arrived in
        // Messenger right above the link card saying the same thing as the
        // card's own title. The card already says who brewed what.
        await navigator.share({ url: giftUrl });
        decide("sent");
      } catch {
        // Dismissed — not an error.
      }
      return;
    }
    setShareOpen(true);
  };

  const leave = () => {
    if (finishedAt) decide("kept", { keepalive: true }); // leaving without choosing = keeping
    finishedRef.current = true; // let the guard step aside
    router.push("/");
  };

  // ---------- end screen: keep it, send it, or both done ----------
  const endActions = () => {
    const sendBtn = (main: boolean) => (
      <button
        type="button"
        className={`potion__done-btn${main ? " potion__done-btn--main" : ""}`}
        onClick={sendToFriend}
      >
        {t("sendToFriend")}
      </button>
    );
    const brewAgain = (
      <button type="button" className="potion__done-btn" onClick={startRound}>
        {t("brewAgain")}
      </button>
    );
    const b = (chunks: React.ReactNode) => <b>{chunks}</b>;

    // No server answer (offline, too fast): nothing counts — just share or play on.
    if (!moon || !roundId) {
      return (
        <>
          {sendBtn(true)}
          {brewAgain}
        </>
      );
    }
    if (decision === "kept") {
      return (
        <>
          <MoonstoneProgress progress={moon} onSignIn={signInToClaim} />
          {brewAgain}
        </>
      );
    }
    if (decision === "sent") {
      return (
        <>
          <PotionMoonRow lit={moon.today} ready={moon.today >= POTIONS_PER_MOONSTONE}>
            <p className="potion-moon__text">{t.rich("sentDone", { b })}</p>
          </PotionMoonRow>
          {brewAgain}
        </>
      );
    }
    // Today's moonstone already earned: keeping would earn nothing.
    if (moon.rewarded) {
      return (
        <>
          <PotionMoonRow lit={POTIONS_PER_MOONSTONE} ready>
            <p className="potion-moon__text">{t("freeToGive")}</p>
          </PotionMoonRow>
          {sendBtn(true)}
          {brewAgain}
        </>
      );
    }
    return (
      <>
        <PotionMoonRow lit={moon.today} pending>
          <p className="potion-moon__text">{t("keepOrSend")}</p>
        </PotionMoonRow>
        <button type="button" className="potion__done-btn potion__done-btn--main" onClick={() => decide("kept")}>
          {t("keepIt")}
        </button>
        {sendBtn(false)}
      </>
    );
  };

  return (
    // Browsers allow sound only after a tap: the first tap anywhere unlocks it.
    <section className={`potion${fullScreen ? " potion--full" : ""}`} onPointerDownCapture={() => sound.current?.unlock()}>
      <h1 className="potion__title title">{t("title")}</h1>
      <p className="potion__subtitle">{t("subtitle")}</p>

      <div className="potion__board">
        <div className="potion__hud">
          <button type="button" className="potion__pill potion__close" onClick={leave} aria-label={t("close")} title={t("close")}>
            ✕
          </button>
          <span className={`potion__pill${hot ? " potion__pill--hot" : ""}`} aria-label={t("timeLabel")}>
            ⏳ {formatTime(finishedAt ? elapsed : timeLeft + 999)}
          </span>
          <span className="potion__hud-group">
            <button
              type="button"
              className={`potion__pill potion__pill--btn potion__sound${muted ? " potion__sound--off" : ""}`}
              onClick={toggleSound}
              aria-label={t(muted ? "soundOn" : "soundOff")}
              title={t(muted ? "soundOn" : "soundOff")}
              aria-pressed={!muted}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4z" />
                {muted ? (
                  <path d="M17 9l5 6M22 9l-5 6" />
                ) : (
                  <>
                    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
                  </>
                )}
              </svg>
            </button>
            <button
              type="button"
              className="potion__pill potion__pill--btn"
              onClick={takeHint}
              disabled={hintUsed || !!finishedAt || !!boiledAt}
            >
              ✦ {t("hint", { count: hintUsed ? 0 : 1 })}
            </button>
          </span>
        </div>

        <div
          ref={stageRef}
          className={`potion__stage${shaking ? " potion__stage--shake" : ""}${blurred ? " potion__stage--blur" : ""}${quaking ? " potion__stage--quake" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="potion__world"
            style={{
              width: WORLD.width,
              height: WORLD.height,
              transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="potion__room" src="/game-art/potion/room.webp" alt="" draggable={false} />
            {CANDLES.map(([x, y, w, h], i) => (
              <span key={`candle-${i}`} className="potion__candle" style={{ left: x, top: y, width: w, height: h }}>
                <span
                  className="potion__candle-glow"
                  style={{ animationDuration: `${2 + (i % 3) * 0.35}s`, animationDelay: `${-i * 0.7}s` }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/game-art/potion/candle-cover-${i + 1}.webp`} alt="" draggable={false} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="potion__candle-flame"
                  src={`/game-art/potion/candle-flame-${i + 1}.webp`}
                  alt=""
                  draggable={false}
                  style={{ animationDuration: `${1.5 + (i % 4) * 0.2}s`, animationDelay: `${-i * 0.45}s` }}
                />
              </span>
            ))}
            <span className="potion__candle" style={{ left: LANTERN.x, top: LANTERN.y, width: 0, height: 0 }}>
              <span className="potion__candle-glow potion__candle-glow--lantern" />
            </span>
            {round?.placements.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${p.spot}-${p.ingredient}`}
                className={`potion__patch${found.has(i) ? " potion__patch--found" : ""}`}
                src={p.src}
                alt=""
                draggable={false}
                style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
              />
            ))}
            {hintPlacement && (
              <span
                className="potion__hint-ring"
                style={{
                  left: hintPlacement.hit[0] + hintPlacement.hit[2] / 2,
                  top: hintPlacement.hit[1] + hintPlacement.hit[3] / 2,
                }}
              />
            )}
            <div ref={fxRef} className="potion-fx" />
          </div>
          {!touched && ready && <span className="potion__pinch">{t("pinchHint")}</span>}
          {!ready && (
            <div className="potion__loader" aria-hidden="true">
              <Ouroboros />
            </div>
          )}

          {failed && (
            <div className="potion__done" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" className="potion__home" onClick={leave} aria-label={t("close")} title={t("close")}>
                <Skull aria-hidden="true" />
              </button>
              <div className="potion__done-card">
                <h2 className="potion__done-title potion__done-title--boiled">{t("boiledTitle")}</h2>
                <p className="potion__done-summary">{t("boiledSummary", { got: landed.size, total })}</p>
                <button type="button" className="potion__done-btn potion__done-btn--main" onClick={startRound}>
                  {t("brewAgain")}
                </button>
              </div>
            </div>
          )}

          {finishedAt && (
            <div className="potion__done" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" className="potion__home" onClick={leave} aria-label={t("close")} title={t("close")}>
                <Skull aria-hidden="true" />
              </button>
              <div className="potion__done-card">
                <h2 className="potion__done-title">{t("doneTitle")}</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="potion__bottle" src="/game-art/potion/bottle.webp" alt="" />
                <p className="potion__done-kicker">{t("youBrewed")}</p>
                <p className="potion__done-name">{potionName}</p>
                <p className="potion__done-summary">
                  {t("doneSummary", { count: total, time: formatTime(elapsed) })}
                </p>
                {endActions()}
              </div>
            </div>
          )}
        </div>

        <div className="potion__recipe" aria-label={t("recipe")}>
          <span className="potion__recipe-label">{t("recipe")}</span>
          {progress.map((line) => {
            const name = t(`ingredients.${line.ingredient}`);
            const complete = line.got >= line.count;
            return (
              <span
                key={line.ingredient}
                className={`potion__ing${complete ? " potion__ing--done" : ""}`}
                aria-label={t("recipeLine", { name, got: line.got, count: line.count })}
                title={name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spritePath(line.ingredient)} alt="" />×{line.count}
                <small>
                  {line.got}/{line.count}
                </small>
              </span>
            );
          })}
        </div>
      </div>
      <ShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={giftUrl}
        shareTitle={t("shareTitle", { potion: potionName })}
        title={t("sendToFriend")}
        slackHint={t("slackCopied")}
        download={gif ? { href: gif.url, filename: "potion.gif", label: t("downloadGif") } : undefined}
        onShared={() => decide("sent")}
      />
    </section>
  );
};
