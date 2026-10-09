"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { track } from "@vercel/analytics";
import { useOpenLogin } from "@/components/LoginContext";
import { Link } from "@/i18n/navigation";
import Skull from "@/assets/svg/skull.svg";
import { Modal } from "@/components/Modal";
import { ShareDialog } from "@/components/ShareDialog";
import { SubscriptionModal } from "@/components/SubscriptionModal";
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
import MoonstoneIcon from "@/assets/svg/moonstone.svg";
import { CastleWheel } from "./CastleWheel";

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
};

function layout(data: typeof ART | typeof PHONE_ART, art: string): Layout {
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
  return { world: { w: data.width, h: data.height }, order: data.order as PlaceId[], patches, placeBox, art };
}

const WIDE_ROOM = layout(ART, "/game-art/castle");
const TALL_ROOM = layout(PHONE_ART, "/game-art/castle/phone");
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
  const [short, setShort] = useState<string | null>(null); // item id we couldn't afford
  const [plansOpen, setPlansOpen] = useState(false);
  const [share, setShare] = useState<{ url: string; name: string } | null>(null);
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
          ? { x: (w - world.w * s) / 2, y: (h - world.h * s) / 2, h }
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

  const buy = async (item: CatalogItem) => {
    if (needSignIn() || busy || item.price === null) return;
    if ((state?.balance ?? 0) < item.price) {
      setShort(item.id);
      return;
    }
    setBusy(true);
    try {
      const data = await post<{ rowId?: string }>("/api/castle/buy", { itemId: item.id });
      apply(data.state);
      if (data.error === "no-moonstones") setShort(item.id);
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
    if (coarse && navigator.share) {
      try {
        await navigator.share({ url });
        setSentNote(true);
      } catch {
        setShare({ url, name }); // cancelled: offer the dialog instead
      }
    } else {
      setShare({ url, name });
    }
  };

  // ---------- wheel ----------
  const canFree = Boolean(state?.freeSpin);
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

  const menuBox = menu?.place ? PLACE_BOX[menu.place] : null;
  const menuPatch = menu?.place ? PATCHES[menu.place]?.[menu.itemId] : null;

  return (
    <section className={`castle${immersive ? " castle--full" : ""}${bare ? " castle--bare" : ""}`}>
      <h1 className="castle__title">{t("title")}</h1>
      <p className="castle__subtitle">{t("subtitle")}</p>

      <div className="castle__hud">
        <button
          type="button"
          className={`castle__pill${canFree ? " castle__pill--glow" : ""}`}
          onClick={() => (needSignIn() ? undefined : setWheelOpen(true))}
        >
          ✦ {canFree ? t("wheelFree") : t("wheelButton")}
        </button>
        <button type="button" className="castle__eye" onClick={() => setBare(true)} aria-label={t("roomOnly")} title={t("roomOnly")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {fullScreen && (
          <Link href="/" className="castle__home" aria-label={t("close")}>
            <Skull aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="castle__board">
        <div className="castle__stage" ref={stageRef} onScroll={onScroll}>
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
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={place}
                    className="castle__patch"
                    src={`${room.art}/patches/${row.itemId}--${place}.webp`}
                    style={{ left: patch.x, top: patch.y, width: patch.w, height: patch.h }}
                    alt=""
                    draggable={false}
                  />
                );
              })}
              {lights.map(({ place, itemId, box }) => (
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
              {placing &&
                ringPlaces.map((place) => {
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
            </div>
          </div>
        </div>

        {bare && (
          <button type="button" className="castle__unbare" onClick={() => setBare(false)} aria-label={t("showButtons")} title={t("showButtons")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M4 4l16 16" />
            </svg>
          </button>
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

        {menu && menuBox && menuPatch && (
          <div
            className="castle__menu"
            style={{
              left: Math.min(Math.max(8, menuPatch.x * scale + view.x - scroll.left), scroll.width - 228),
              top: Math.min((menuPatch.y + menuPatch.h) * scale + view.y + 10, view.h - (immersive ? 230 : 40)),
            }}
          >
            <p className="castle__menu-title">{t(`items.${menu.itemId}`)}</p>
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
      <div className="castle__bar">
        <button type="button" className="castle__btn" disabled>
          {t("throwParty")}
        </button>
      </div>
      {state?.signedIn === false && (
        <p className="castle__note">
          <a href="#" onClick={(e) => (e.preventDefault(), openLogin())}>
            {t("signInToPlay")}
          </a>
        </p>
      )}
      {state?.signedIn && (
        <p className="castle__note">
          {needs.length
            ? t("missing", { list: needs.map((n) => t(`needs.${n}`)).join(", ") })
            : t("partySoon")}
        </p>
      )}
      {sentNote && (
        <p className="castle__note castle__note--sent">
          <b>{t("sentTitle")}</b> {t("sentBody")}
        </p>
      )}
      </div>

      {/* ---------- catalog ---------- */}
      <Modal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} wide>
        <div className="castle-dialog">
          <div className="castle-dialog__head">
            <h2 className="castle-dialog__title">{t("catalog")}</h2>
            <span className="castle__stones">
              <MoonstoneIcon aria-hidden="true" />
              {state?.balance ?? 0}
            </span>
          </div>
          <div className="castle-dialog__tabs">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                className={`castle-dialog__tab${tab === id ? " castle-dialog__tab--on" : ""}`}
                onClick={() => setTab(id)}
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
                  {short === item.id && (
                    <p className="castle-card__short">
                      {t("notEnough")} ·{" "}
                      <a href="#" onClick={(e) => (e.preventDefault(), setPlansOpen(true))}>
                        {t("getMoonstones")}
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ---------- my items ---------- */}
      <Modal isOpen={storageOpen} onClose={() => setStorageOpen(false)} wide>
        <div className="castle-dialog">
          <div className="castle-dialog__head">
            <h2 className="castle-dialog__title">{t("myItems")}</h2>
          </div>
          {items.length === 0 ? (
            <p className="castle__note">{t("storageEmpty")}</p>
          ) : (
            <div className="castle-dialog__grid">
              {items.map((row) => {
                const item = catalogItem(row.itemId);
                if (!item) return null;
                return (
                  <div key={row.id} className="castle-card">
                    <div className="castle-card__pic">
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

      {/* ---------- just bought ---------- */}
      <Modal isOpen={Boolean(got)} onClose={() => setGot(null)} narrow>
        {got && gotCard({ row: got, kicker: t("yoursNow") })}
      </Modal>

      {/* ---------- swap ---------- */}
      <Modal isOpen={Boolean(swapFor)} onClose={() => setSwapFor(null)} wide>
        <div className="castle-dialog">
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
          <CastleWheel target={spinTarget} spinKey={spinKey} onStopped={onSpinStopped} />
          {canFree || canPaid ? (
            <button type="button" className="castle__btn castle__btn--main castle-wheel-panel__spin" disabled={spinning} onClick={spin}>
              {spinning ? t("spinning") : canFree ? t("spinFree") : t("spinPaid")}
            </button>
          ) : (
            <p className="castle__note">{spinning ? t("spinning") : t("spinTomorrow")}</p>
          )}
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
        onClose={() => setShare(null)}
        url={share?.url ?? ""}
        shareTitle={share?.name ?? ""}
        compact
        onShared={() => setSentNote(true)}
      />
      <SubscriptionModal isOpen={plansOpen} onClose={() => setPlansOpen(false)} />
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
