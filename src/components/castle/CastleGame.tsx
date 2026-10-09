"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { track } from "@vercel/analytics";
import { useOpenLogin } from "@/components/LoginContext";
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
import MoonstoneIcon from "@/assets/svg/moonstone.svg";
import Skull from "@/assets/svg/skull.svg";
import { CastleWheel } from "./CastleWheel";

/**
 * "They Arrive at Midnight": dress an abandoned castle's dining hall.
 *
 * The room is a 1600×899 world. On wide screens it fits the width; on phones it
 * fits the height and scrolls sideways (the browser's own scrolling, so taps and
 * swipes just work). Every item in every place is a pre-rendered patch
 * (scripts/build-castle-art.py); lit items add a warm light layer on top,
 * blended with "screen" so it brightens the room like real light.
 */

type Box = { x: number; y: number; w: number; h: number };
type Patch = Box & { light?: Box };
const WORLD = { w: ART.width, h: ART.height };
const ORDER = ART.order as PlaceId[];
const PATCHES = ART.places as unknown as Record<PlaceId, Record<string, Patch>>;
const ICON = (id: string) => `/game-art/castle/icons/${id}.webp`;

/** The glowing outline for a place: all its possible items together. */
const PLACE_BOX: Record<string, Box> = Object.fromEntries(
  Object.entries(PATCHES).map(([place, items]) => {
    const boxes = Object.values(items);
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.w));
    const y1 = Math.max(...boxes.map((b) => b.y + b.h));
    return [place, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  }),
);

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
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [scroll, setScroll] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const { clientWidth: w, clientHeight: h } = stage;
      // Wide screens: the whole room fits the width. Phones: fit the height and scroll.
      const s = w / h >= WORLD.w / WORLD.h ? w / WORLD.w : h / WORLD.h;
      setScale(s);
      setScroll({ left: stage.scrollLeft, width: w });
    };
    fit();
    // Phones open on the middle of the room (the table).
    stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

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
        // Things that stand somewhere: choose the spot right away.
        if (item.places.length && !item.autoPlace) {
          setCatalogOpen(false);
          setPlacing({ id: data.rowId, itemId: item.id, place: null });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const startPlacing = (row: OwnedItem) => {
    setCatalogOpen(false);
    setMenu(null);
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
  const ringPlaces = placing ? (catalogItem(placing.itemId)?.places ?? []) : [];
  const offLeft = ringPlaces.filter((p) => (PLACE_BOX[p].x + PLACE_BOX[p].w) * scale < scroll.left).length;
  const offRight = ringPlaces.filter((p) => PLACE_BOX[p].x * scale > scroll.left + scroll.width).length;

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
    <section className="castle">
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
      </div>

      <div className="castle__board">
        <div className="castle__stage" ref={stageRef} onScroll={onScroll}>
          <div className="castle__extent" style={{ width: WORLD.w * scale, height: WORLD.h * scale }}>
            <div className="castle__world" style={{ width: WORLD.w, height: WORLD.h, transform: `scale(${scale})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="castle__room" src="/game-art/castle/room.webp" alt="" draggable={false} />
              {ORDER.map((place) => {
                const row = placedAt.get(place);
                const patch = row ? PATCHES[place]?.[row.itemId] : undefined;
                if (!row || !patch) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={place}
                    className="castle__patch"
                    src={`/game-art/castle/patches/${row.itemId}--${place}.webp`}
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
                  src={`/game-art/castle/lights/${itemId}--${place}.webp`}
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
                  const b = PLACE_BOX[place];
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
              left: Math.min(Math.max(8, menuPatch.x * scale - scroll.left), scroll.width - 228),
              top: Math.min((menuPatch.y + menuPatch.h) * scale + 10, WORLD.h * scale - 40),
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

      <div className="castle__bar">
        <button type="button" className="castle__btn castle__btn--main" onClick={() => (needSignIn() ? undefined : setCatalogOpen(true))}>
          {t("catalog")}
        </button>
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

      {/* ---------- catalog ---------- */}
      {catalogOpen && (
        <div className="castle-sheet" role="dialog" aria-label={t("catalog")}>
          <div className="castle-sheet__dim" onClick={() => setCatalogOpen(false)} />
          <div className="castle-sheet__panel">
            <div className="castle-sheet__head">
              <b>{t("catalog")}</b>
              <span className="castle__stones">
                <MoonstoneIcon aria-hidden="true" />
                {state?.balance ?? 0}
              </span>
              <button type="button" className="castle-sheet__close" onClick={() => setCatalogOpen(false)} aria-label={t("close")}>
                <Skull aria-hidden="true" />
              </button>
            </div>
            <div className="castle-sheet__tabs">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`castle-sheet__tab${tab === id ? " castle-sheet__tab--on" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {t(`tabs.${id}`)}
                </button>
              ))}
            </div>
            <div className="castle-sheet__grid">
              {CATALOG.filter((c) => c.tab === tab).map((item) => {
                const owned = ownedOf(item.id);
                const spare = owned.find((o) => !o.place);
                const placed = owned.some((o) => o.place);
                return (
                  <div key={item.id} className="castle-card">
                    {item.price === null && <span className="castle-card__tag">{t("wheelOnly")}</span>}
                    <div className="castle-card__pic">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ICON(item.id)} alt="" loading="lazy" />
                    </div>
                    <p className="castle-card__name">{t(`items.${item.id}`)}</p>
                    {owned.length > 0 && (
                      <p className="castle-card__owned">
                        ✓{" "}
                        {item.record
                          ? t("inMusic")
                          : item.autoPlace && placed
                            ? t("fireLit")
                            : placed && !spare
                              ? t("ownedPlaced")
                              : owned.length > 1
                                ? t("ownedCount", { count: owned.length })
                                : t("owned")}
                      </p>
                    )}
                    <div className="castle-card__row">
                      {spare && item.places.length > 0 && !item.autoPlace ? (
                        <button type="button" className="castle-card__buy" onClick={() => startPlacing(spare)}>
                          {t("place")}
                        </button>
                      ) : item.price === null ? (
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
        </div>
      )}

      {/* ---------- swap ---------- */}
      {swapFor && (
        <div className="castle-sheet" role="dialog" aria-label={t("swapTitle")}>
          <div className="castle-sheet__dim" onClick={() => setSwapFor(null)} />
          <div className="castle-sheet__panel castle-sheet__panel--short">
            <div className="castle-sheet__head">
              <b>{t("swapTitle")}</b>
              <button type="button" className="castle-sheet__close" onClick={() => setSwapFor(null)} aria-label={t("close")}>
                <Skull aria-hidden="true" />
              </button>
            </div>
            {swapChoices.length === 0 ? (
              <p className="castle__note">{t("nothingToSwap")}</p>
            ) : (
              <div className="castle-sheet__grid">
                {swapChoices.map((row) => (
                  <button key={row.id} type="button" className="castle-card castle-card--pick" onClick={() => swapTo(row, swapFor.place!)}>
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
        </div>
      )}

      {/* ---------- wheel ---------- */}
      {wheelOpen && (
        <div className="castle-sheet castle-sheet--wheel" role="dialog" aria-label={t("wheelTitle")}>
          <div className="castle-sheet__dim" onClick={() => !spinning && setWheelOpen(false)} />
          <div className="castle-sheet__panel castle-wheel-panel">
            <button type="button" className="castle-sheet__close castle-wheel-panel__close" onClick={() => !spinning && setWheelOpen(false)} aria-label={t("close")}>
              <Skull aria-hidden="true" />
            </button>
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
                <div className="castle-prize__card">
                  {prize.kind === "rare" && <p className="castle-prize__kicker">{t("rareItem")}</p>}
                  {prize.itemId ? (
                    <>
                      <div className="castle-prize__pic">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ICON(prize.itemId)} alt="" />
                      </div>
                      <h3>{t(`items.${prize.itemId}`)}</h3>
                      {catalogItem(prize.itemId)?.price === null && <p>{t("wheelOnlyNote")}</p>}
                      <button
                        type="button"
                        className="castle__btn castle__btn--main"
                        onClick={() => {
                          const row = items.find((i) => i.id === prize.rowId);
                          setPrize(null);
                          setWheelOpen(false);
                          if (row) startPlacing(row);
                        }}
                      >
                        {t("hangNow")}
                      </button>
                      <button type="button" className="castle__btn" onClick={() => setPrize(null)}>
                        {t("keepLater")}
                      </button>
                      <button
                        type="button"
                        className="castle__btn"
                        onClick={() => {
                          const row = items.find((i) => i.id === prize.rowId);
                          setPrize(null);
                          setWheelOpen(false);
                          if (row) void send(row);
                        }}
                      >
                        {t("send")}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="castle-prize__kicker">{t("youWon")}</p>
                      <div className="castle-prize__stones">
                        +{prize.stones} <MoonstoneIcon aria-hidden="true" />
                      </div>
                      <h3>{t("moonstonesWon", { count: prize.stones })}</h3>
                      <button type="button" className="castle__btn castle__btn--main" onClick={() => setPrize(null)}>
                        {t("close")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
};
