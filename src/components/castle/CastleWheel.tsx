"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { WHEEL, type PrizeKind } from "@/lib/castleGame/catalog";
import MoonstoneIcon from "@/assets/svg/moonstone.svg";

/**
 * The wheel of fortune, drawn in black and gold only (Lena, 2026-10-08): a
 * gothic rose window with iron spokes, a thorned rim and a bat-winged dagger
 * pointer. `turn` is the pane the server picked; the wheel spins to it.
 */

const N = WHEEL.length;
const PANE_DEG = 360 / N;
const SPIN_MS = 4800;

/** Pictures shown on the item panes (gold-toned), just for the look. */
const PANE_ICONS = ["treatPie", "vaseLavender", "paintingRaven"];

type Props = {
  /** Pane index to land on; changing it starts a spin. */
  target: number | null;
  /** Bumps every spin, so the same pane twice still spins. */
  spinKey: number;
  onStopped: () => void;
};

function arc(r: number, a: number): [number, number] {
  return [r * Math.cos(a), r * Math.sin(a)];
}

export const CastleWheel = ({ target, spinKey, onStopped }: Props) => {
  const t = useTranslations("castle");
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);

  useEffect(() => {
    if (target === null) return;
    // Pane i sits at i·PANE_DEG clockwise from the top; turn so it ends under
    // the pointer, after five full turns, with a small random offset inside it.
    const jitter = (Math.random() - 0.5) * PANE_DEG * 0.6;
    const base = angleRef.current - (angleRef.current % 360);
    const next = base + 360 * 5 + (360 - target * PANE_DEG) + jitter;
    angleRef.current = next;
    setAngle(next);
    const timer = window.setTimeout(onStopped, SPIN_MS + 100);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  const R = 136;
  const panes = WHEEL.map((kind, i) => {
    const a0 = (i / N) * 2 * Math.PI - Math.PI / 2 - Math.PI / N;
    const a1 = a0 + (2 * Math.PI) / N;
    const am = (a0 + a1) / 2;
    const [x0, y0] = arc(R, a0);
    const [x1, y1] = arc(R, a1);
    const [cx, cy] = arc(84, am);
    const deg = (am * 180) / Math.PI + 90;
    return { kind, i, x0, y0, x1, y1, cx, cy, deg };
  });

  return (
    <div className="castle-wheel">
      <svg className="castle-wheel__pointer" viewBox="-48 -10 96 62" aria-hidden="true">
        <path
          d="M0 4 C-6 -2 -16 -4 -46 2 C-36 6 -32 12 -30 20 C-24 14 -16 14 -12 18 C-10 12 -6 10 -3 11 Z M0 4 C6 -2 16 -4 46 2 C36 6 32 12 30 20 C24 14 16 14 12 18 C10 12 6 10 3 11 Z"
          fill="#141116"
          stroke="#fae1a3"
          strokeWidth="1"
        />
        <path d="M-3 6 L3 6 L3 22 L0 50 L-3 22 Z" fill="#cfc6b8" stroke="#fae1a3" strokeWidth=".8" />
        <rect x="-8" y="4" width="16" height="4" rx="1" fill="#fae1a3" />
        <circle cy="0" r="4" fill="#090909" stroke="#fae1a3" strokeWidth=".8" />
      </svg>
      <svg
        className="castle-wheel__disc"
        viewBox="-178 -178 356 356"
        style={{ transform: `rotate(${angle}deg)`, transitionDuration: `${SPIN_MS}ms` }}
        role="img"
        aria-label={t("wheelTitle")}
      >
        <defs>
          <radialGradient id="cw-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(140)">
            <stop offset=".15" stopColor="#1c1a1d" />
            <stop offset=".75" stopColor="#0f0e10" />
            <stop offset="1" stopColor="#080708" />
          </radialGradient>
          <radialGradient id="cw-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(140)">
            <stop offset=".15" stopColor="#121113" />
            <stop offset=".75" stopColor="#0a090b" />
            <stop offset="1" stopColor="#050505" />
          </radialGradient>
          <radialGradient id="cw-rare" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(140)">
            <stop offset=".15" stopColor="#2b261c" />
            <stop offset=".75" stopColor="#141209" />
            <stop offset="1" stopColor="#080705" />
          </radialGradient>
          <linearGradient id="cw-iron" x1="0" y1="-1" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3225" />
            <stop offset=".5" stopColor="#16130e" />
            <stop offset="1" stopColor="#090909" />
          </linearGradient>
          <filter id="cw-gold">
            <feColorMatrix type="matrix" values=".5 .5 .5 0 0  .44 .44 .44 0 0  .3 .3 .3 0 0  0 0 0 1 0" />
          </filter>
        </defs>
        <path
          d={Array.from({ length: 32 }, (_, i) => {
            const a = (i / 32) * 2 * Math.PI;
            const L = i % 2 ? 166 : 174;
            const [x0, y0] = arc(150, a - 0.055);
            const [x1, y1] = arc(L, a);
            const [x2, y2] = arc(150, a + 0.055);
            return `M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}Z`;
          }).join("")}
          fill="#1a171c"
          stroke="rgba(250,225,163,.55)"
          strokeWidth=".8"
        />
        <circle r="156" fill="#141116" stroke="rgba(250,225,163,.65)" strokeWidth="1.6" />
        <circle r="148" fill="none" stroke="rgba(250,225,163,.25)" strokeWidth="1" />
        {panes.map((p) => (
          <g key={p.i}>
            <path
              d={`M0 0L${p.x0} ${p.y0}A${R} ${R} 0 0 1 ${p.x1} ${p.y1}Z`}
              fill={p.kind === "rare" ? "url(#cw-rare)" : p.i % 2 ? "url(#cw-b)" : "url(#cw-a)"}
            />
            <g transform={`rotate(${p.deg})`}>
              <path
                d="M-26 -112 L-26 -92 M26 -112 L26 -92 M-26 -112 Q-26 -132 0 -134 Q26 -132 26 -112"
                fill="none"
                stroke="rgba(10,8,12,.95)"
                strokeWidth="3.2"
              />
              <path
                d="M-26 -112 Q-26 -132 0 -134 Q26 -132 26 -112"
                fill="none"
                stroke={p.kind === "rare" ? "rgba(250,225,163,.85)" : "rgba(250,225,163,.35)"}
                strokeWidth=".8"
              />
            </g>
            <PaneLabel kind={p.kind} i={p.i} x={p.cx} y={p.cy} deg={p.deg} itemLabel={t("paneItem")} rareLabel={t("paneRare")} />
          </g>
        ))}
        {panes.map((p) => {
          const a = (p.i / N) * 2 * Math.PI - Math.PI / 2 - Math.PI / N;
          return (
            <g key={`s${p.i}`} transform={`rotate(${(a * 180) / Math.PI + 90})`}>
              <path d="M-3 -30 L-3 -128 L0 -140 L3 -128 L3 -30Z" fill="url(#cw-iron)" stroke="rgba(250,225,163,.45)" strokeWidth=".6" />
            </g>
          );
        })}
        <circle r={R} fill="none" stroke="#0e0c10" strokeWidth="5" />
        <circle r={R} fill="none" stroke="rgba(250,225,163,.5)" strokeWidth="1" />
        {Array.from({ length: 16 }, (_, i) => {
          const [x, y] = arc(152, (i / 16) * 2 * Math.PI + Math.PI / 16);
          return <circle key={i} cx={x} cy={y} r="2.6" fill="#2a2418" stroke="rgba(250,225,163,.7)" strokeWidth=".6" />;
        })}
        <circle r="31" fill="#0b090d" stroke="#fae1a3" strokeWidth="1.4" />
      </svg>
      <MoonstoneIcon className="castle-wheel__hub" aria-hidden="true" />
    </div>
  );
};

const PaneLabel = ({
  kind,
  i,
  x,
  y,
  deg,
  itemLabel,
  rareLabel,
}: {
  kind: PrizeKind;
  i: number;
  x: number;
  y: number;
  deg: number;
  itemLabel: string;
  rareLabel: string;
}) => {
  const stones = kind === "stone1" ? 1 : kind === "stone2" ? 2 : kind === "stone3" ? 3 : 0;
  if (stones) {
    return (
      <g transform={`translate(${x} ${y}) rotate(${deg})`}>
        <image href="/game-art/castle/moonstone.svg" x="-16" y="-26" width="32" height="32" />
        <text y="24" textAnchor="middle" fill="#fae1a3" fontWeight="300" fontSize="18">
          ×{stones}
        </text>
      </g>
    );
  }
  const icon = kind === "rare" ? "mirrorGhost" : PANE_ICONS[i % PANE_ICONS.length];
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`}>
      <image href={`/game-art/castle/icons/${icon}.webp`} x="-18" y="-30" width="36" height="38" filter="url(#cw-gold)" />
      <text y="25" textAnchor="middle" fill="#fae1a3" fontWeight="300" fontSize="11" letterSpacing="2.5">
        {(kind === "rare" ? rareLabel : itemLabel).toUpperCase()}
      </text>
    </g>
  );
};
