"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { track } from "@vercel/analytics";
import { useOpenLogin } from "@/components/LoginContext";
import { Link } from "@/i18n/navigation";
import Skull from "@/assets/svg/skull.svg";
import { Modal } from "@/components/Modal";
import { ShareDialog } from "@/components/ShareDialog";
import { MoreMoonstonesModal } from "@/components/MoonstonesModal";
import { notifyMoonstonesChanged } from "@/lib/moonstones";
import {
  CATALOG,
  PAID_SPIN_PRICE,
  TABS,
  catalogItem,
  partyNeeds,
  type CatalogItem,
  type OwnedItem,
  type PlaceId,
  type PrizeKind,
  type TabId,
} from "@/lib/castleGame/catalog";
import type { CastleState } from "@/lib/castleGame/server";
import ART from "@/lib/castleGame/places.generated.json";
import PHONE_ART from "@/lib/castleGame/places.phone.generated.json";
import TABLE_SPOTS from "@/lib/castleGame/table-spots.generated.json";
import MoonstoneIcon from "@/assets/svg/moonstone.svg";
import { CastleWheel } from "./CastleWheel";
import { CastleParty, type PartyOutcome } from "./CastleParty";

/**
 * "They Arrive at Midnight": dress an abandoned castle's dining hall.
 *
 * The room is a 1600×899 world. On wide screens it fits the width. Phones held
 * upright get their own tall room (776×1680, Lena 2026-10-09) that fills the
 * screen; it shows only the three back-wall frames, so whatever hangs on the
 * side walls is seen on a computer only. Every item in every place is a pre-rendered patch
 * (scripts/build-castle-art.py); lit items add a warm light layer on top,
 * blended with "screen" so it brightens the room like real light.
 */

type Box = { x: number; y: number; w: number; h: number };
type Patch = Box & { light?: Box };
type Layout = {
  world: { w: number; h: number };
  order: PlaceId[];
  patches: Record<PlaceId, Record<string, Patch>>;
  /** The glowing outline for a place: all its possible items together. */
  placeBox: Partial<Record<PlaceId, Box>>;
  /** Where its room, patches and lights live. */
  art: string;
  /** Spots on the table, drawn flat on the table top in perspective (scripts/build-table-spots.py). */
  spots: Partial<Record<PlaceId, number[][][]>>;
};

function layout(data: typeof ART | typeof PHONE_ART, art: string, spots: Layout["spots"]): Layout {
  const patches = data.places as unknown as Record<PlaceId, Record<string, Patch>>;
  const placeBox = Object.fromEntries(
    Object.entries(patches).map(([place, items]) => {
      const boxes = Object.values(items);
      const x0 = Math.min(...boxes.map((b) => b.x));
      const y0 = Math.min(...boxes.map((b) => b.y));
      const x1 = Math.max(...boxes.map((b) => b.x + b.w));
      const y1 = Math.max(...boxes.map((b) => b.y + b.h));
      return [place, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
    }),
  );
  return { world: { w: data.width, h: data.height }, order: data.order as PlaceId[], patches, placeBox, art, spots };
}

const WIDE_ROOM = layout(ART, "/game-art/castle", TABLE_SPOTS.wide as Layout["spots"]);
const TALL_ROOM = layout(PHONE_ART, "/game-art/castle/phone", TABLE_SPOTS.phone as Layout["spots"]);
const ICON = (id: string) => `/game-art/castle/icons/${id}.webp`;
/** Phones (portrait, or landscape with little height): the hall takes the whole screen, no site header (Lena, 2026-10-09). */
const FULL_SCREEN_QUERY = "(max-width: 48em), (max-height: 500px)";
/** Phones held upright get the tall room. */
const TALL_ROOM_QUERY = "(max-width: 48em) and (orientation: portrait)";

type SpinOutcome = {
  pane: number;
  kind: PrizeKind;
  stones: number;
  itemId: string | null;
  rowId: string | null;
};

async function post<T>(url: string, body?: unknown): Promise<T & { error?: string; state?: CastleState }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
}

/** What would fit an empty spot, and where the catalog sells it (Lena, 2026-10-13). */
const SPOT_HINT: Record<PlaceId, { hint: string; tab: TabId }> = {
  cloth: { hint: "cloth", tab: "table" },
  settings: { hint: "settings", tab: "table" },
  tableCentre: { hint: "tableCentre", tab: "table" },
  treatMiddle: { hint: "treat", tab: "treats" },
  treatFront: { hint: "treat", tab: "treats" },
  ceiling: { hint: "ceiling", tab: "lights" },
  shelf: { hint: "ledge", tab: "lights" },
  mantel: { hint: "ledge", tab: "lights" },
  wallLeft: { hint: "wall", tab: "walls" },
  wallBackLeft: { hint: "wall", tab: "walls" },
  wallBackCentre: { hint: "wall", tab: "walls" },
  wallBackRight: { hint: "wall", tab: "walls" },
  wallRight: { hint: "wall", tab: "walls" },
  fireplace: { hint: "fireplace", tab: "fireMusic" },
  corner: { hint: "corner", tab: "fireMusic" },
};
/** How much wider than drawn a table spot catches a tap (Lena, 2026-10-16). */
const SPOT_REACH: Partial<Record<PlaceId, number>> = { tableCentre: 2, treatMiddle: 2, treatFront: 2, settings: 1.3 };
/** A polygon grown around its own middle. */
function widen(pts: number[][], k: number): string {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(([x, y]) => `${cx + (x - cx) * k},${cy + (y - cy) * k}`).join(" ");
}

/** On the bare table only the cloth is offered; the rest stands on it. */
const ON_THE_CLOTH: PlaceId[] = ["settings", "tableCentre", "treatMiddle", "treatFront"];
const SOUND_KEY = "castle-sound";

export const CastleGame = () => {
  const t = useTranslations("castle");
  const { status: authStatus } = useSession();
  const openLogin = useOpenLogin();

  const [state, setState] = useState<CastleState | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("lights");
  const [placing, setPlacing] = useState<OwnedItem | null>(null);
  const [menu, setMenu] = useState<OwnedItem | null>(null);
  const [swapFor, setSwapFor] = useState<OwnedItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [share, setShare] = useState<{ url: string; name: string; rowId: string } | null>(null);
  // Closed without sending: the gift goes back to the vault (Lena, 2026-10-14).
  const shared = useRef(false);
  const unsend = async (rowId: string) => {
    const data = await post("/api/castle/unsend", { rowId });
    apply(data.state);
  };
  const [sentNote, setSentNote] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);

  // ---------- listening to records (Lena, 2026-10-09) ----------
  // One sample at a time; closing the window stops it.
  const [listening, setListening] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopListening = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setListening(null);
  }, []);
  const listen = (item: CatalogItem) => {
    if (!item.sample) return;
    const same = listening === item.id;
    stopListening();
    if (same) return;
    gramRef.current?.pause();
    gramRef.current = null;
    setPlaying(null);
    const audio = new Audio(`/sounds/castle/${item.sample}-sample.mp3`);
    audio.addEventListener("ended", () => {
      if (audioRef.current === audio) stopListening();
    });
    audioRef.current = audio;
    setListening(item.id);
    audio.play().catch(() => {
      if (audioRef.current === audio) stopListening();
    });
    track("castle_listen", { item: item.id });
  };
  useEffect(() => {
    if (!catalogOpen && !storageOpen) stopListening();
  }, [catalogOpen, storageOpen, stopListening]);
  useEffect(() => stopListening, [stopListening]);
  const listenButton = (item: CatalogItem) =>
    item.sample ? (
      <button
        type="button"
        className={`castle-card__listen${listening === item.id ? " castle-card__listen--on" : ""}`}
        onClick={() => listen(item)}
        aria-label={t(listening === item.id ? "stopListening" : "listen")}
        title={t(listening === item.id ? "stopListening" : "listen")}
        aria-pressed={listening === item.id}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          {listening === item.id ? <rect x="3" y="3" width="10" height="10" rx="1" /> : <path d="M4 2.5v11l9.5-5.5z" />}
        </svg>
      </button>
    ) : null;
  // Just bought: place it, keep it or give it away (Lena, 2026-10-09).
  const [got, setGot] = useState<OwnedItem | null>(null);

  const [wheelOpen, setWheelOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [spinTarget, setSpinTarget] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<SpinOutcome | null>(null);
  const pendingState = useRef<CastleState | null>(null);

  // ---------- data ----------
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/castle/state", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {
      // keep what we have
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "loading") void load();
  }, [authStatus, load]);

  const apply = (next?: CastleState) => {
    if (!next) return;
    if (state && next.balance !== state.balance) notifyMoonstonesChanged();
    setState(next);
  };

  const items = useMemo(() => state?.items ?? [], [state]);
  const placedAt = useMemo(() => {
    const map = new Map<PlaceId, OwnedItem>();
    items.forEach((i) => i.place && map.set(i.place, i));
    return map;
  }, [items]);
  const needs = partyNeeds(items);
  // ---------- sound (Lena, 2026-10-13) ----------
  // Wind blows through the empty hall until the fire is lit; then the fire
  // crackles. Browsers allow sound only after a first tap, so it starts then.
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "off") setSoundOn(false);
    } catch {
      // storage blocked: sound stays on
    }
  }, []);
  const toggleSound = () => {
    setSoundOn((on) => {
      try {
        localStorage.setItem(SOUND_KEY, on ? "off" : "on");
      } catch {
        // not remembered, still switched
      }
      return !on;
    });
  };
  const fireLit = placedAt.has("fireplace");
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    // Arriving by a click on the site (the games page, the main page) counts as
    // a tap: the wind starts with the hall, as the cauldron does (Lena,
    // 2026-10-14). From a shared link the browser waits for the first tap.
    const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
    if (nav.userActivation?.hasBeenActive) setUnlocked(true);
    const unlock = () => setUnlocked(true);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // ---------- hints on empty spots ----------
  const [hint, setHint] = useState<PlaceId | null>(null);
  // "Where can things go?" (Lena, 2026-10-16): every free spot glows at once.
  const [showSpots, setShowSpots] = useState(false);
  const hintTimer = useRef<number | null>(null);
  const keepHint = () => {
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = null;
  };
  const dropHint = () => {
    keepHint();
    hintTimer.current = window.setTimeout(() => setHint(null), 250);
  };

  // A click on a glowing empty spot opens the Emporium on the spot's tab
  // (Lena, 2026-10-14). With a mouse the spot already glows on hover; on a
  // phone the first tap shows the hint and a second tap on it opens the shop.
  const lastPointer = useRef<string>("mouse");
  const notePointer = (e: { pointerType: string }) => {
    lastPointer.current = e.pointerType;
  };
  // The spot the shop was opened from: an item bought or placed next goes
  // straight there, no second choosing (Lena, 2026-10-16).
  const wantedSpot = useRef<{ place: PlaceId; replace?: boolean } | null>(null);
  const openShopFor = (place: PlaceId) => {
    setHint(null);
    if (needSignIn()) return;
    wantedSpot.current = { place };
    setTab(SPOT_HINT[place].tab);
    setCatalogOpen(true);
  };
  const tapEmpty = (place: PlaceId) => {
    keepHint();
    setMenu(null);
    if (lastPointer.current === "mouse" || hint === place) return openShopFor(place);
    setHint(place);
  };

  // A tap outside the item menu closes it (Lena, 2026-10-14).
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest(".castle__menu, .castle__hit, .castle__spot--placed")) setMenu(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [menu]);

  // A tap anywhere else closes the hint (phones have no "mouse leaves").
  useEffect(() => {
    if (!hint) return;
    const away = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest(".castle__hint, .castle__empty, .castle__spot")) setHint(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [hint]);

  /** Records the player owns, one per kind, in catalog order. */
  const records = useMemo(
    () => CATALOG.filter((c) => c.record && c.sample && items.some((i) => i.itemId === c.id)),
    [items],
  );

  // ---------- viewport ----------
  const [fullScreen, setFullScreen] = useState(false);
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const full = window.matchMedia(FULL_SCREEN_QUERY);
    const upright = window.matchMedia(TALL_ROOM_QUERY);
    const sync = () => {
      setFullScreen(full.matches);
      setTall(upright.matches);
    };
    sync();
    full.addEventListener("change", sync);
    upright.addEventListener("change", sync);
    return () => {
      full.removeEventListener("change", sync);
      upright.removeEventListener("change", sync);
    };
  }, []);
  const room = tall ? TALL_ROOM : WIDE_ROOM;
  const { world: WORLD, order: ORDER, patches: PATCHES, placeBox: PLACE_BOX } = room;

  // "Room only" (Lena, 2026-10-09): every button and line hides, the hall fills the screen.
  const [bare, setBare] = useState(false);
  const immersive = fullScreen || bare;
  // The full-screen button (classic corners icon, Lena 2026-10-14): the hall
  // alone, and the browser's own full screen where it exists. Leaving the
  // browser's full screen (Esc) brings the buttons back too.
  const browserFull = useRef(false);
  const enterFull = () => {
    setBare(true);
    const req = document.documentElement.requestFullscreen?.();
    if (req) {
      browserFull.current = true;
      void req.catch(() => (browserFull.current = false));
    }
  };
  const leaveFull = () => {
    setBare(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    browserFull.current = false;
  };
  useEffect(() => {
    // Android Chrome can leave the page zoomed in after full screen ends
    // (Lena, 2026-10-15). Capping the zoom for a moment snaps it back to 1;
    // the normal setting returns right after, so pinch-zoom still works.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const normal = meta?.content ?? "";
    let zoomTimer: number | undefined;
    const resetZoom = () => {
      if (!meta) return;
      meta.content = `${normal}, maximum-scale=1`;
      window.clearTimeout(zoomTimer);
      zoomTimer = window.setTimeout(() => (meta.content = normal), 300);
    };
    const onChange = () => {
      if (!document.fullscreenElement) resetZoom();
      if (!document.fullscreenElement && browserFull.current) {
        browserFull.current = false;
        setBare(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.clearTimeout(zoomTimer);
      if (meta) meta.content = normal;
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("castle-locked", immersive);
    return () => document.documentElement.classList.remove("castle-locked");
  }, [immersive]);

  const stageRef = useRef<HTMLDivElement>(null);
  const centred = useRef(false);
  const immersiveRef = useRef(immersive);
  immersiveRef.current = immersive;
  const worldRef = useRef(WORLD);
  worldRef.current = WORLD;
  const [scale, setScale] = useState(0.5);
  const [scroll, setScroll] = useState({ left: 0, width: 0 });
  // Full screen: the room fills the screen and is centred; what does not fit is
  // trimmed, never scrolled (Lena, 2026-10-09).
  const [view, setView] = useState({ x: 0, y: 0, h: 0 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const { clientWidth: w, clientHeight: h } = stage;
      const world = worldRef.current;
      // Wide screens: the whole room fits the width. Phones: fit the height and scroll.
      const wide = w / h >= world.w / world.h;
      // Full screen fills it ("cover"); the page view shows the whole room ("contain").
      const s = immersiveRef.current
        ? Math.max(w / world.w, h / world.h)
        : wide
          ? w / world.w
          : h / world.h;
      setScale(s);
      setView(
        immersiveRef.current
          ? // The upright room is centred on its fireplace (Lena, 2026-10-14).
            { x: (w - world.w * s) / 2, y: (h - world.h * s) / 2, h }
          : { x: 0, y: 0, h: world.h * s },
      );
      setScroll({ left: stage.scrollLeft, width: w });
    };
    fit();
    window.addEventListener("castle:refit", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => {
      ro.disconnect();
      window.removeEventListener("castle:refit", fit);
    };
  }, []);

  useEffect(() => {
    centred.current = false; // re-centre for the new size
    window.dispatchEvent(new Event("castle:refit"));
  }, [immersive, tall]);

  // Phones open on the middle of the room (the table) — once the room has its
  // real size, so the middle is the real middle.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || centred.current) return;
    if (stage.scrollWidth <= stage.clientWidth && stage.scrollHeight <= stage.clientHeight) return;
    stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
    stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    setScroll({ left: stage.scrollLeft, width: stage.clientWidth });
    centred.current = true;
  }, [scale, immersive, tall]);

  const onScroll = () => {
    setHint(null);
    const stage = stageRef.current;
    if (stage) setScroll({ left: stage.scrollLeft, width: stage.clientWidth });
  };

  // ---------- actions ----------
  const needSignIn = () => {
    if (authStatus !== "authenticated") {
      openLogin();
      return true;
    }
    return false;
  };

  // ---------- party night (Lena, 2026-10-13) ----------
  const [recordPick, setRecordPick] = useState<string | null>(null); // open: the chosen record id
  const [party, setParty] = useState<{ record: string; run: number } | null>(null);
  const [partyOutcome, setPartyOutcome] = useState<PartyOutcome | null>(null);
  const bareBefore = useRef(false);
  const [partyShare, setPartyShare] = useState(false);

  const startParty = async (recordId: string) => {
    const sample = catalogItem(recordId)?.sample;
    if (!sample) return;
    setRecordPick(null);
    bareBefore.current = bare;
    setBare(true); // the real hall fills the screen under the film
    setPartyOutcome(null);
    setParty({ record: sample, run: 1 });
    track("castle_party", { record: recordId });
    try {
      const data = await post<Partial<PartyOutcome>>("/api/castle/party");
      apply(data.state);
      if (typeof data.bats === "number") {
        setPartyOutcome({
          bats: data.bats,
          best: data.best ?? data.bats,
          stones: data.stones ?? 0,
          toNext: data.toNext ?? null,
          eaten: data.eaten ?? 0,
          burnt: Boolean(data.burnt),
        });
      }
    } catch {
      // the film still plays; the rating just doesn't show
    }
  };

  const throwParty = () => {
    if (needSignIn() || needs.length || !records.length) return;
    if (records.length === 1) void startParty(records[0].id);
    else setRecordPick(records[0].id);
  };

  // Phones: the party is an icon by the full-screen one. Dim until the hall has
  // everything; a tap on it then says what is missing (Lena, 2026-10-15).
  const partyReady = Boolean(state?.signedIn) && !needs.length && records.length > 0;
  const [partyTip, setPartyTip] = useState(false);
  const tapParty = () => {
    if (needSignIn()) return;
    if (partyReady) {
      setPartyTip(false);
      throwParty();
      return;
    }
    setPartyTip((on) => !on);
  };
  useEffect(() => {
    if (!partyTip) return;
    const away = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest(".castle__party")) setPartyTip(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [partyTip]);
  const partyIcon = (
    <span className="castle__party">
      <button
        type="button"
        className={`castle__eye castle__party-btn${partyReady ? " castle__party-btn--ready" : ""}`}
        onClick={tapParty}
        aria-label={t("throwParty")}
        title={t("throwParty")}
        aria-expanded={partyReady ? undefined : partyTip}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.5h10l-.6 5.2a4.4 4.4 0 0 1-8.8 0z" />
          <path d="M12 13.5v6M8.5 20.5h7" />
        </svg>
      </button>
      {partyTip && !partyReady && (
        <span className="castle__party-tip" role="status">
          {t("missing", { list: needs.map((n) => t(`needs.${n}`)).join(", ") })}
        </span>
      )}
    </span>
  );

  // Phones: the first tap in the hall only clears the buttons away, so the
  // next taps reach the table under them (Lena, 2026-10-15).
  const tapHall = (e: ReactMouseEvent) => {
    if (!fullScreen || bare || placing) return;
    e.preventDefault();
    e.stopPropagation();
    setHint(null);
    setMenu(null);
    enterFull();
  };

  const closeParty = () => {
    setParty(null);
    setBare(bareBefore.current);
  };

  // The hall's own sound: wind until the fire is lit, then the fire. Quiet while
  // a record sample or the party film plays, and when the page is hidden.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  // ---------- the gramophone (Lena, 2026-10-14) ----------
  // The full song of a record the player owns, looping, while the gramophone
  // stands in the hall. The sound button stops it with everything else.
  const [playing, setPlaying] = useState<string | null>(null); // record item id
  const gramRef = useRef<HTMLAudioElement | null>(null);
  const stopRecord = useCallback(() => {
    gramRef.current?.pause();
    gramRef.current = null;
    setPlaying(null);
  }, []);
  const playRecord = (recordId: string) => {
    const same = playing === recordId;
    stopRecord();
    if (same) return;
    const sample = catalogItem(recordId)?.sample;
    if (!sample) return;
    stopListening();
    if (!soundOn) toggleSound(); // pressing play means "I want to hear it"
    const audio = new Audio(`/sounds/castle/${sample}-full.mp3`);
    audio.loop = true;
    audio.volume = 0.7;
    gramRef.current = audio;
    setPlaying(recordId);
    audio.play().catch(() => {
      if (gramRef.current === audio) stopRecord();
    });
    track("castle_gramophone", { record: recordId });
  };
  const gramophoneUp = placedAt.has("corner");
  useEffect(() => {
    if (playing && (!soundOn || party || hidden || !gramophoneUp || !items.some((i) => i.itemId === playing))) stopRecord();
  }, [playing, soundOn, party, hidden, gramophoneUp, items, stopRecord]);
  useEffect(() => stopRecord, [stopRecord]);

  const ambience = fireLit ? "fire" : "wind";
  const ambienceOn = soundOn && unlocked && !hidden && !party && !listening;
  // Under a playing record the wind or fire steps back.
  const ambienceLevel = (ambience === "fire" ? 0.45 : 0.35) * (playing ? 0.35 : 1);
  const ambienceLevelRef = useRef(ambienceLevel);
  ambienceLevelRef.current = ambienceLevel;
  useEffect(() => {
    if (!ambienceOn) return;
    const audio = new Audio(`/sounds/castle/${ambience}-loop.mp3`);
    audio.loop = true;
    audio.volume = 0;
    ambienceRef.current = audio;
    // If the browser still holds sound back, the first tap starts it.
    const retry = () => void audio.play().catch(() => undefined);
    void audio.play().catch(() => {
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });
    // glides towards its level, so it never starts or changes with a jolt
    const glide = window.setInterval(() => {
      const target = ambienceLevelRef.current;
      const v = audio.volume;
      audio.volume = Math.abs(target - v) < 0.03 ? target : v + Math.sign(target - v) * 0.03;
    }, 80);
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      window.clearInterval(glide);
      audio.pause();
      if (ambienceRef.current === audio) ambienceRef.current = null;
    };
  }, [ambienceOn, ambience]);

  const buy = async (item: CatalogItem) => {
    if (needSignIn() || busy || item.price === null) return;
    if ((state?.balance ?? 0) < item.price) {
      setPlansOpen(true); // straight to the moonstones (Lena, 2026-10-14)
      return;
    }
    setBusy(true);
    try {
      const data = await post<{ rowId?: string }>("/api/castle/buy", { itemId: item.id });
      apply(data.state);
      if (data.error === "no-moonstones") setPlansOpen(true);
      if (data.rowId) {
        track("castle_bought", { item: item.id });
        setCatalogOpen(false);
        setGot({ id: data.rowId, itemId: item.id, place: item.autoPlace ?? null });
      }
    } finally {
      setBusy(false);
    }
  };

  /** Puts an item in the room. One possible place: straight there. Several: the spots glow. */
  const placeRow = async (row: OwnedItem) => {
    setCatalogOpen(false);
    setStorageOpen(false);
    setMenu(null);
    setGot(null);
    const places = catalogItem(row.itemId)?.places ?? [];
    if (places.length === 0) return;
    const wanted = wantedSpot.current;
    wantedSpot.current = null;
    // from a free spot, or from "swap" (the old item goes back to the vault)
    if (wanted && places.includes(wanted.place) && (wanted.replace || !placedAt.has(wanted.place))) {
      const data = await post("/api/castle/place", { rowId: row.id, place: wanted.place });
      apply(data.state);
      track("castle_placed", { item: row.itemId, place: wanted.place });
      return;
    }
    if (places.length === 1) {
      const data = await post("/api/castle/place", { rowId: row.id, place: places[0] });
      apply(data.state);
      track("castle_placed", { item: row.itemId, place: places[0] });
      return;
    }
    setPlacing(row);
  };

  const putAt = async (place: PlaceId) => {
    if (!placing || busy) return;
    setBusy(true);
    try {
      const data = await post("/api/castle/place", { rowId: placing.id, place });
      apply(data.state);
      track("castle_placed", { item: placing.itemId, place });
    } finally {
      setBusy(false);
      setPlacing(null);
    }
  };

  const [clearAsk, setClearAsk] = useState(false);
  const clearHall = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await post("/api/castle/clear");
      apply(data.state);
      track("castle_cleared");
    } finally {
      setBusy(false);
      setClearAsk(false);
    }
  };

  const takeDown = async (row: OwnedItem) => {
    setMenu(null);
    const data = await post("/api/castle/take-down", { rowId: row.id });
    apply(data.state);
  };

  const swapTo = async (row: OwnedItem, place: PlaceId) => {
    setSwapFor(null);
    const data = await post("/api/castle/place", { rowId: row.id, place });
    apply(data.state);
  };

  const send = async (row: OwnedItem) => {
    setMenu(null);
    setGot(null);
    setStorageOpen(false);
    if (needSignIn()) return;
    const data = await post<{ giftId?: string }>("/api/castle/send", { rowId: row.id });
    apply(data.state);
    if (!data.giftId) return;
    track("castle_sent", { item: row.itemId });
    // No language in the link: each friend opens it in their own language.
    const url = `${window.location.origin}/castle/gift/${data.giftId}`;
    const name = t(`items.${row.itemId}`);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    shared.current = false;
    if (coarse && navigator.share) {
      try {
        await navigator.share({ url });
        setSentNote(true);
      } catch {
        setShare({ url, name, rowId: row.id }); // cancelled: offer the dialog instead
      }
    } else {
      setShare({ url, name, rowId: row.id });
    }
  };

  // ---------- wheel ----------
  const canFree = Boolean(state?.freeSpin);
  // Time to the next free spin, counted down while the wheel is open (Lena, 2026-10-14).
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (!wheelOpen) return;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, [wheelOpen]);
  const minutesLeft = Math.max(1, Math.ceil(((state?.nextSpinAt ?? 0) - clock) / 60000));
  const nextFreeText = t("nextFree", { hours: Math.floor(minutesLeft / 60), minutes: minutesLeft % 60 });
  const canPaid = Boolean(state?.paidSpin);

  const spin = async () => {
    if (needSignIn() || spinning) return;
    if (!canFree && canPaid && (state?.balance ?? 0) < PAID_SPIN_PRICE) {
      setPlansOpen(true);
      return;
    }
    setPrize(null);
    setSpinning(true);
    const data = await post<Partial<SpinOutcome>>("/api/castle/spin");
    if (data.error || typeof data.pane !== "number") {
      setSpinning(false);
      apply(data.state);
      if (data.error === "no-moonstones") setPlansOpen(true);
      return;
    }
    pendingState.current = data.state ?? null;
    setSpinTarget(data.pane);
    setSpinKey((k) => k + 1);
    setPrize({
      pane: data.pane,
      kind: data.kind as PrizeKind,
      stones: data.stones ?? 0,
      itemId: data.itemId ?? null,
      rowId: data.rowId ?? null,
    });
    track("castle_spin", { prize: data.itemId ?? data.kind ?? "" });
  };

  const onSpinStopped = () => {
    setSpinning(false);
    apply(pendingState.current ?? undefined);
    pendingState.current = null;
  };

  // ---------- room ----------
  // only the places this room shows (the tall room has no side walls)
  const ringPlaces = placing ? (catalogItem(placing.itemId)?.places ?? []).filter((p) => PLACE_BOX[p]) : [];
  // (full screen never scrolls, so there is nothing to point at off the edges)
  const offLeft = immersive ? 0 : ringPlaces.filter((p) => (PLACE_BOX[p]!.x + PLACE_BOX[p]!.w) * scale < scroll.left).length;
  const offRight = immersive ? 0 : ringPlaces.filter((p) => PLACE_BOX[p]!.x * scale > scroll.left + scroll.width).length;

  const lights = ORDER.flatMap((place) => {
    const row = placedAt.get(place);
    const patch = row ? PATCHES[place]?.[row.itemId] : undefined;
    return patch?.light ? [{ place, itemId: row!.itemId, box: patch.light }] : [];
  });

  const ownedOf = (id: string) => items.filter((i) => i.itemId === id);
  const swapChoices = swapFor
    ? items.filter((i) => !i.place && i.id !== swapFor.id && catalogItem(i.itemId)?.places.includes(swapFor.place!))
    : [];

  const emptySpots = ORDER.filter(
    (place) => PLACE_BOX[place] && !placedAt.has(place) && !(ON_THE_CLOTH.includes(place) && !placedAt.has("cloth")),
  );
  const hintBox = hint && !placing && !placedAt.has(hint) ? PLACE_BOX[hint] : null;

  const menuBox = menu?.place ? PLACE_BOX[menu.place] : null;
  const menuPatch = menu?.place ? PATCHES[menu.place]?.[menu.itemId] : null;

  return (
    <section className={`castle${immersive ? " castle--full" : ""}${bare ? " castle--bare" : ""}`}>
      <h1 className="castle__title">{t("title")}</h1>
      <p className="castle__subtitle">{t("subtitle")}</p>

      <div className="castle__hud">
        {/* The wheel as a small fortune-wheel icon (Lena, 2026-10-16); it glows
            while today's free spin waits. */}
        <button
          type="button"
          className={`castle__eye castle__wheel-btn${canFree ? " castle__eye--glow" : ""}`}
          onClick={() => (needSignIn() ? undefined : setWheelOpen(true))}
          aria-label={canFree ? t("wheelFree") : t("wheelButton")}
          title={canFree ? t("wheelFree") : t("wheelButton")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="13" r="8" />
            <circle cx="12" cy="13" r="1.8" />
            <path d="M12 5v16M5.07 9l13.86 8M5.07 17l13.86-8" />
            <path d="M10.4 2.6h3.2L12 5.2z" fill="currentColor" />
            <path d="M20.5 2.5l.45 1.05 1.05.45-1.05.45-.45 1.05-.45-1.05L19 4l1.05-.45z" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          type="button"
          className={`castle__eye castle__sound${soundOn ? "" : " castle__sound--off"}`}
          onClick={toggleSound}
          aria-label={t("sound")}
          title={t("sound")}
          aria-pressed={soundOn}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
            {soundOn ? (
              <>
                <path d="M15.5 9a4 4 0 0 1 0 6" />
                <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
              </>
            ) : (
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
            )}
          </svg>
        </button>
        <button
          type="button"
          className={`castle__eye${showSpots ? " castle__eye--on" : ""}`}
          onClick={() => setShowSpots((v) => !v)}
          aria-label={t("showSpots")}
          title={t("showSpots")}
          aria-pressed={showSpots}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="3" strokeDasharray="3 2.4" />
            <path d="M12 9v6M9 12h6" />
          </svg>
        </button>
        <button type="button" className="castle__eye" onClick={() => enterFull()} aria-label={t("fullScreen")} title={t("fullScreen")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
        </button>
        {fullScreen && partyIcon}
        {fullScreen && (
          <Link href="/" className="castle__home" aria-label={t("close")}>
            <Skull aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="castle__board">
        <div className="castle__stage" ref={stageRef} onScroll={onScroll} onClickCapture={tapHall}>
          <div
            className="castle__extent"
            style={{ width: WORLD.w * scale, height: WORLD.h * scale, left: view.x, top: view.y }}
          >
            <div className="castle__world" style={{ width: WORLD.w, height: WORLD.h, transform: `scale(${scale})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="castle__room" src={`${room.art}/room.webp`} alt="" draggable={false} />
              {ORDER.map((place) => {
                const row = placedAt.get(place);
                const patch = row ? PATCHES[place]?.[row.itemId] : undefined;
                if (!row || !patch) return null;
                const fireGlow = place === "fireplace" && patch.light;
                return (
                  <Fragment key={place}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="castle__patch"
                      src={`${room.art}/patches/${row.itemId}--${place}.webp`}
                      style={{ left: patch.x, top: patch.y, width: patch.w, height: patch.h }}
                      alt=""
                      draggable={false}
                    />
                    {/* The fire's glow lies under whatever stands in front of the
                        fireplace, so the table and its things stay clear (Lena, 2026-10-16). */}
                    {fireGlow && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="castle__light castle__light--fire"
                        src={`${room.art}/lights/${row.itemId}--${place}.webp`}
                        style={{ left: fireGlow.x, top: fireGlow.y, width: fireGlow.w, height: fireGlow.h }}
                        alt=""
                        draggable={false}
                      />
                    )}
                  </Fragment>
                );
              })}
              {lights.filter((l) => l.place !== "fireplace").map(({ place, itemId, box }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`l-${place}`}
                  className={`castle__light${place === "fireplace" ? " castle__light--fire" : ""}`}
                  src={`${room.art}/lights/${itemId}--${place}.webp`}
                  style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                  alt=""
                  draggable={false}
                />
              ))}
              {/* Tap targets for placed items (not while choosing a spot). */}
              {!placing &&
                ORDER.map((place) => {
                  const row = placedAt.get(place);
                  const patch = row ? PATCHES[place]?.[row.itemId] : undefined;
                  if (!row || !patch || place === "fireplace") return null;
                  // Placed plates are tapped on the plates themselves (below), not
                  // on a box over the whole table that hid the middle spots.
                  if (place === "settings" && room.spots.settings) return null;
                  return (
                    <button
                      key={`t-${place}`}
                      type="button"
                      className={`castle__hit${menu?.id === row.id ? " castle__hit--on" : ""}`}
                      style={{ left: patch.x, top: patch.y, width: patch.w, height: patch.h, borderWidth: 2 / scale }}
                      aria-label={t(`items.${row.itemId}`)}
                      onClick={() => setMenu(menu?.id === row.id ? null : row)}
                    />
                  );
                })}
              {/* Empty spots: a hint of what would fit (Lena, 2026-10-13). */}
              {!placing &&
                emptySpots.filter((place) => !room.spots[place]).map((place) => {
                  const b = PLACE_BOX[place]!;
                  return (
                    <button
                      key={`e-${place}`}
                      type="button"
                      className={`castle__empty${hint === place || showSpots ? " castle__empty--on" : ""}`}
                      style={{ left: b.x, top: b.y, width: b.w, height: b.h, borderWidth: 2 / scale }}
                      aria-label={t(`hints.${SPOT_HINT[place].hint}`)}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "mouse") return;
                        keepHint();
                        setHint(place);
                      }}
                      onPointerLeave={(e) => e.pointerType === "mouse" && dropHint()}
                      onPointerDown={notePointer}
                      onClick={() => tapEmpty(place)}
                    />
                  );
                })}
              {placing &&
                ringPlaces.filter((place) => !room.spots[place]).map((place) => {
                  const b = PLACE_BOX[place]!;
                  return (
                    <button
                      key={`r-${place}`}
                      type="button"
                      className={`castle__ring${placedAt.has(place) ? " castle__ring--busy" : ""}`}
                      style={{ left: b.x, top: b.y, width: b.w, height: b.h, borderWidth: 2.5 / scale }}
                      aria-label={place}
                      onClick={() => putAt(place)}
                    />
                  );
                })}
              {/* Table spots lie flat on the table top, like the plates (Lena, 2026-10-14). */}
              <svg className="castle__spots" width={WORLD.w} height={WORLD.h} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} aria-hidden={false}>
                {/* Placed plates: only the plates open their menu (Lena, 2026-10-16). */}
                {!placing &&
                  (() => {
                    const row = placedAt.get("settings");
                    const shapes = room.spots.settings;
                    if (!row || !shapes) return null;
                    return (
                      <g
                        role="button"
                        tabIndex={0}
                        aria-label={t(`items.${row.itemId}`)}
                        className={`castle__spot castle__spot--placed${menu?.id === row.id ? " castle__spot--on" : ""}`}
                        onClick={() => setMenu(menu?.id === row.id ? null : row)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setMenu(menu?.id === row.id ? null : row)}
                      >
                        {shapes.map((pts, i) => (
                          <polygon key={i} className="castle__spot-reach" points={widen(pts, 1.25)} />
                        ))}
                      </g>
                    );
                  })()}
                {(placing ? ringPlaces : emptySpots).map((place) => {
                  const shapes = room.spots[place];
                  if (!shapes) return null;
                  const ring = Boolean(placing);
                  const choose = () => {
                    if (ring) return void putAt(place);
                    tapEmpty(place);
                  };
                  return (
                    <g
                      key={`s-${place}`}
                      role="button"
                      tabIndex={0}
                      aria-label={ring ? place : t(`hints.${SPOT_HINT[place].hint}`)}
                      className={`castle__spot${ring ? " castle__spot--ring" : ""}${ring && placedAt.has(place) ? " castle__spot--busy" : ""}${!ring && (hint === place || showSpots) ? " castle__spot--on" : ""}`}
                      onClick={choose}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choose()}
                      onPointerEnter={(e) => {
                        if (ring || e.pointerType !== "mouse") return;
                        keepHint();
                        setHint(place);
                      }}
                      onPointerLeave={(e) => !ring && e.pointerType === "mouse" && dropHint()}
                      onPointerDown={notePointer}
                    >
                      {shapes.map((pts, i) => (
                        <polygon key={i} points={pts.map((p) => p.join(",")).join(" ")} />
                      ))}
                      {/* A wider invisible area around small spots, so a tap near
                          the middle of the table finds them (Lena, 2026-10-16). */}
                      {(SPOT_REACH[place] ?? 1) > 1 &&
                        shapes.map((pts, i) => (
                          <polygon key={`r${i}`} className="castle__spot-reach" points={widen(pts, SPOT_REACH[place]!)} />
                        ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {bare && (
          <div className="castle__corner">
            {fullScreen && partyIcon}
            <button type="button" className="castle__unbare" onClick={() => leaveFull()} aria-label={t("exitFullScreen")} title={t("exitFullScreen")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" />
              </svg>
            </button>
          </div>
        )}
        {placing && (
          <div className="castle__banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON(placing.itemId)} alt="" />
            <span>{t("placeBanner", { name: t(`items.${placing.itemId}`) })}</span>
            <button type="button" className="castle__banner-x" onClick={() => setPlacing(null)}>
              {t("cancel")}
            </button>
          </div>
        )}
        {placing && offLeft > 0 && <span className="castle__edge castle__edge--left">{t("moreLeft", { count: offLeft })}</span>}
        {placing && offRight > 0 && <span className="castle__edge castle__edge--right">{t("moreRight", { count: offRight })}</span>}

        {hint && hintBox && (
          <div
            className="castle__hint"
            onMouseEnter={keepHint}
            onMouseLeave={dropHint}
            style={{
              left: Math.min(Math.max(8, (hintBox.x + hintBox.w / 2) * scale + view.x - scroll.left - 140), scroll.width - 288),
              top:
                hintBox.y * scale + view.y > 110
                  ? hintBox.y * scale + view.y - 92
                  : Math.min((hintBox.y + hintBox.h) * scale + view.y + 10, view.h - 100),
            }}
          >
            <p className="castle__hint-text">{t(`hints.${SPOT_HINT[hint].hint}`)}</p>
            <button
              type="button"
              className="castle__hint-link"
              onClick={() => openShopFor(hint)}
            >
              {t("hintLink")}
            </button>
          </div>
        )}
        {menu && menuBox && menuPatch && (
          <div
            className="castle__menu"
            style={{
              left: Math.min(Math.max(8, menuPatch.x * scale + view.x - scroll.left), scroll.width - 228),
              top: Math.max(8, Math.min((menuPatch.y + menuPatch.h) * scale + view.y + 10, view.h - (immersive ? 230 : 40) - (menu.place === "corner" ? records.length * 44 : 0))),
            }}
          >
            <div className="castle__menu-head">
              <p className="castle__menu-title">{t(`items.${menu.itemId}`)}</p>
              <button type="button" className="castle__menu-x" onClick={() => setMenu(null)} aria-label={t("close")} title={t("close")}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </div>
            {menu.place === "corner" &&
              records.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`castle__menu-play${playing === r.id ? " castle__menu-play--on" : ""}`}
                  onClick={() => playRecord(r.id)}
                  aria-pressed={playing === r.id}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    {playing === r.id ? <rect x="3.5" y="3.5" width="9" height="9" rx="1" /> : <path d="M5 3v10l8-5z" />}
                  </svg>
                  {t(`items.${r.id}`).replace(/^[^:]*:\s*/, "")}
                </button>
              ))}
            <button type="button" className="castle__menu-btn" onClick={() => takeDown(menu)}>
              {t("takeDown")}
            </button>
            <button
              type="button"
              className="castle__menu-btn"
              onClick={() => {
                setSwapFor(menu);
                setMenu(null);
              }}
            >
              {t("swap")}
            </button>
            <button type="button" className="castle__menu-btn" onClick={() => send(menu)}>
              {t("send")}
            </button>
          </div>
        )}
      </div>

      <div className="castle__dock">
      <div className="castle__bar">
        <button type="button" className="castle__btn castle__btn--main" onClick={() => (needSignIn() ? undefined : setCatalogOpen(true))}>
          {t("catalog")}
        </button>
        <button type="button" className="castle__btn castle__btn--main" onClick={() => (needSignIn() ? undefined : setStorageOpen(true))}>
          {t("myItems")}
          {items.length > 0 && <span className="castle__count">{items.length}</span>}
        </button>
      </div>
      {!fullScreen && (
      <div className="castle__bar">
        <button
          type="button"
          className={`castle__btn${state?.signedIn && !needs.length ? " castle__btn--main" : ""}`}
          disabled={!state?.signedIn || needs.length > 0}
          onClick={throwParty}
        >
          {t("throwParty")}
        </button>
      </div>
      )}
      {state?.signedIn === false && (
        <p className="castle__note">
          <a href="#" onClick={(e) => (e.preventDefault(), openLogin())}>
            {t("signInToPlay")}
          </a>
        </p>
      )}
      {state?.signedIn && !fullScreen && (
        <p className="castle__note">
          {needs.length
            ? t("missing", { list: needs.map((n) => t(`needs.${n}`)).join(", ") })
            : t("partyReady")}
        </p>
      )}
      {sentNote && (
        <p className="castle__note castle__note--sent">
          <b>{t("sentTitle")}</b> {t("sentBody")}
        </p>
      )}
      </div>

      {/* ---------- party night ---------- */}
      <Modal isOpen={recordPick !== null} onClose={() => setRecordPick(null)} narrow>
        <div className="castle-dialog castle-dialog--records">
          <h2 className="castle-dialog__title">{t("party.pickRecord")}</h2>
          <div className="castle-records" role="radiogroup" aria-label={t("party.pickRecord")}>
            {records.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={recordPick === r.id}
                className={`castle-records__item${recordPick === r.id ? " castle-records__item--on" : ""}`}
                onClick={() => setRecordPick(r.id)}
              >
                <span className="castle-records__dot" aria-hidden="true" />
                {t(`items.${r.id}`)}
              </button>
            ))}
          </div>
          <button type="button" className="castle-records__start" onClick={() => recordPick && void startParty(recordPick)}>
            {t("party.start")}
          </button>
        </div>
      </Modal>
      {party && (
        <CastleParty
          record={party.record}
          run={party.run}
          outcome={partyOutcome}
          muted={!soundOn}
          tall={tall}
          onReplay={() => setParty((p) => (p ? { ...p, run: p.run + 1 } : p))}
          onShare={() => {
            track("castle_party_share");
            setPartyShare(true);
          }}
          onClose={closeParty}
        />
      )}

      {/* ---------- catalog ---------- */}
      <Modal
        isOpen={catalogOpen}
        onClose={() => {
          wantedSpot.current = null;
          setCatalogOpen(false);
        }}
        wide
        pinned
      >
        <div className="castle-dialog">
          <div className="castle-dialog__head">
            <h2 className="castle-dialog__title">{t("catalog")}</h2>
            <span className="castle__stones">
              <MoonstoneIcon aria-hidden="true" />
              {state?.balance ?? 0}
            </span>
            <button type="button" className="castle-dialog__clear" onClick={() => (setCatalogOpen(false), setStorageOpen(true))}>
              {t("toVault")}
              {items.length > 0 && <span className="castle__count">{items.length}</span>}
            </button>
          </div>
          <div className="castle-dialog__tabs">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                className={`castle-dialog__tab${tab === id ? " castle-dialog__tab--on" : ""}`}
                onClick={(e) => {
                  setTab(id);
                  // the chosen tab slides fully into view
                  e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
                }}
              >
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>
          <div className="castle-dialog__grid">
            {CATALOG.filter((c) => c.tab === tab).map((item) => {
              const owned = ownedOf(item.id).length;
              return (
                <div key={item.id} className="castle-card">
                  {item.price === null && <span className="castle-card__tag">{t("wheelOnly")}</span>}
                  <div className="castle-card__pic">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ICON(item.id)} alt="" loading="lazy" />
                    {listenButton(item)}
                  </div>
                  <p className="castle-card__name">{t(`items.${item.id}`)}</p>
                  {owned > 0 && <p className="castle-card__owned">✓ {t("ownedCount", { count: owned })}</p>}
                  <div className="castle-card__row">
                    {item.price === null ? (
                      <span className="castle-card__wheel">{t("winOnWheel")}</span>
                    ) : (
                      <>
                        <span className="castle__stones">
                          <MoonstoneIcon aria-hidden="true" />
                          {item.price}
                        </span>
                        <button type="button" className="castle-card__buy" disabled={busy} onClick={() => buy(item)}>
                          {t("buy")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ---------- my items ---------- */}
      <Modal isOpen={storageOpen} onClose={() => setStorageOpen(false)} wide pinned>
        <div className="castle-dialog">
          <div className="castle-dialog__head">
            <h2 className="castle-dialog__title">{t("myItems")}</h2>
            <button type="button" className="castle-dialog__clear" onClick={() => (setStorageOpen(false), setCatalogOpen(true))}>
              {t("toEmporium")}
            </button>
            {items.some((i) => i.place) && (
              <button type="button" className="castle-dialog__clear castle-dialog__clear--next" onClick={() => setClearAsk(true)}>
                {t("clearHall")}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="castle__note">{t("storageEmpty")}</p>
          ) : (
            <div className="castle-dialog__grid">
              {[...items]
                .sort((a, b) => Number(Boolean(b.place)) - Number(Boolean(a.place)))
                .map((row) => {
                const item = catalogItem(row.itemId);
                if (!item) return null;
                return (
                  <div key={row.id} className={`castle-card${row.place ? " castle-card--in-hall" : ""}`}>
                    <div className="castle-card__pic">
                      {row.place && <span className="castle-card__badge">{statusOf(row)}</span>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ICON(row.itemId)} alt="" loading="lazy" />
                      {listenButton(item)}
                    </div>
                    <p className="castle-card__name">{t(`items.${row.itemId}`)}</p>
                    <p className="castle-card__owned">{statusOf(row)}</p>
                    <div className="castle-card__row castle-card__row--two">
                      {!row.place && item.places.length > 0 && (
                        <button type="button" className="castle-card__buy" onClick={() => placeRow(row)}>
                          {t("place")}
                        </button>
                      )}
                      {row.place && row.place !== "fireplace" && (
                        <button type="button" className="castle-card__buy" onClick={() => takeDown(row)}>
                          {t("takeDown")}
                        </button>
                      )}
                      <button type="button" className="castle-card__buy" onClick={() => send(row)}>
                        {t("sendShort")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ---------- clear the hall ---------- */}
      <Modal isOpen={clearAsk} onClose={() => setClearAsk(false)} narrow>
        <div className="castle-dialog castle-dialog--records">
          <h2 className="castle-dialog__title">{t("clearAsk")}</h2>
          <p className="castle-dialog__text">{t("clearBody")}</p>
          <div className="castle-dialog__pair">
            <button type="button" className="castle-records__start castle-records__start--plain" onClick={() => setClearAsk(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="castle-records__start" disabled={busy} onClick={clearHall}>
              {t("clearHall")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------- just bought ---------- */}
      <Modal
        isOpen={Boolean(got)}
        onClose={() => {
          wantedSpot.current = null;
          setGot(null);
        }}
        narrow
      >
        {got && gotCard({ row: got, kicker: t("yoursNow") })}
      </Modal>

      {/* ---------- swap ---------- */}
      <Modal isOpen={Boolean(swapFor)} onClose={() => setSwapFor(null)} wide>
        <div className="castle-dialog">
          {/* top left, across from the close skull */}
          <div className="castle-dialog__top">
            {/* Find something new for this spot (Lena, 2026-10-16): what is
                bought next takes the old item's place. */}
            <button
              type="button"
              className="castle-dialog__clear castle-dialog__clear--next"
              onClick={() => {
                const place = swapFor?.place;
                setSwapFor(null);
                if (!place) return;
                wantedSpot.current = { place, replace: true };
                setTab(SPOT_HINT[place].tab);
                setCatalogOpen(true);
              }}
            >
              {t("toEmporium")}
            </button>
          </div>
          <div className="castle-dialog__head">
            <h2 className="castle-dialog__title">{t("swapTitle")}</h2>
          </div>
          {swapChoices.length === 0 ? (
            <p className="castle__note">{t("nothingToSwap")}</p>
          ) : (
            <div className="castle-dialog__grid">
              {swapChoices.map((row) => (
                <button key={row.id} type="button" className="castle-card castle-card--pick" onClick={() => swapTo(row, swapFor!.place!)}>
                  <div className="castle-card__pic">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ICON(row.itemId)} alt="" />
                  </div>
                  <p className="castle-card__name">{t(`items.${row.itemId}`)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ---------- wheel ---------- */}
      <Modal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} dismissible={!spinning} narrow>
        <div className="castle-dialog castle-wheel-panel">
          <h2 className="castle-wheel-panel__title">{t("wheelTitle")}</h2>
          <p className="castle__subtitle">{t("wheelSub")}</p>
          <p className="castle-wheel-panel__balance">
            <span className="castle__stones">
              <MoonstoneIcon aria-hidden="true" />
              {state?.balance ?? 0}
            </span>
          </p>
          <CastleWheel target={spinTarget} spinKey={spinKey} onStopped={onSpinStopped} />
          {canFree || canPaid ? (
            <button type="button" className="castle__btn castle__btn--main castle-wheel-panel__spin" disabled={spinning} onClick={spin}>
              {spinning ? t("spinning") : canFree ? t("spinFree") : t("spinPaid")}
            </button>
          ) : (
            <p className="castle__note">{spinning ? t("spinning") : nextFreeText}</p>
          )}
          {!canFree && canPaid && !spinning && <p className="castle__note">{nextFreeText}</p>}
          <p className="castle-wheel-panel__odds">{t("odds")}</p>

          {prize && !spinning && (
            <div className="castle-prize">
              {prize.itemId && prize.rowId ? (
                gotCard({
                  row: { id: prize.rowId, itemId: prize.itemId, place: null },
                  kicker: prize.kind === "rare" ? t("rareItem") : t("youWon"),
                  onKeep: () => setPrize(null),
                  onLeave: () => {
                    setPrize(null);
                    setWheelOpen(false);
                  },
                })
              ) : (
                <div className="castle-prize__card">
                  <p className="castle-prize__kicker">{t("youWon")}</p>
                  <div className="castle-prize__stones">
                    +{prize.stones} <MoonstoneIcon aria-hidden="true" />
                  </div>
                  <h3>{t("moonstonesWon", { count: prize.stones })}</h3>
                  <button type="button" className="castle__btn castle__btn--main" onClick={() => setPrize(null)}>
                    {t("close")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ShareDialog
        isOpen={Boolean(share)}
        onClose={() => {
          if (share && !shared.current) void unsend(share.rowId);
          setShare(null);
        }}
        url={share?.url ?? ""}
        shareTitle={share?.name ?? ""}
        compact
        sendToPerson
        // A gift is given once (Lena, 2026-10-14): the moment it leaves, the window closes.
        onShared={() => {
          shared.current = true;
          setSentNote(true);
          window.setTimeout(() => setShare(null), 300);
        }}
      />
      <ShareDialog
        isOpen={partyShare}
        onClose={() => setPartyShare(false)}
        // No language in the link: each friend opens it in their own language.
        url={partyShare ? `${window.location.origin}/castle/survived` : ""}
        shareTitle={t("partyShareTitle")}
        compact
      />
      <MoreMoonstonesModal isOpen={plansOpen} onClose={() => setPlansOpen(false)} />
    </section>
  );

  /** Where an owned item is, in words. */
  function statusOf(row: OwnedItem): string {
    const item = catalogItem(row.itemId);
    if (item?.record) return t("inMusic");
    if (row.place === "fireplace") return t("fireLit");
    return row.place ? t("inHall") : t("inStorage");
  }

  /** "Yours now" — after buying or winning: place it, keep it, or give it away. */
  function gotCard({
    row,
    kicker,
    onKeep = () => setGot(null),
    onLeave = () => setGot(null),
  }: {
    row: OwnedItem;
    kicker: string;
    onKeep?: () => void;
    onLeave?: () => void;
  }) {
    const item = catalogItem(row.itemId);
    const live = items.find((i) => i.id === row.id) ?? row;
    const canPlace = Boolean(item && item.places.length > 0 && !item.autoPlace && !live.place);
    return (
      <div className="castle-prize__card">
        <p className="castle-prize__kicker">{kicker}</p>
        <div className="castle-prize__pic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON(row.itemId)} alt="" />
        </div>
        <h3>{t(`items.${row.itemId}`)}</h3>
        {item?.price === null && <p>{t("wheelOnlyNote")}</p>}
        {item?.record && <p>{t("inMusic")}</p>}
        {live.place === "fireplace" && <p>{t("fireLit")}</p>}
        {canPlace && (
          <button
            type="button"
            className="castle__btn castle__btn--main"
            onClick={() => {
              onLeave();
              void placeRow(live);
            }}
          >
            {t("hangNow")}
          </button>
        )}
        <button type="button" className="castle__btn" onClick={onKeep}>
          {t("keepLater")}
        </button>
        <button
          type="button"
          className="castle__btn"
          onClick={() => {
            onLeave();
            void send(live);
          }}
        >
          {t("send")}
        </button>
      </div>
    );
  }
};
