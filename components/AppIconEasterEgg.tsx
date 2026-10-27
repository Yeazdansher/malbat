"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./AppIconEasterEgg.module.css";

type Phase =
  | "idle"
  | "dim"
  | "soil"
  | "seed"
  | "roots"
  | "trunk"
  | "branches"
  | "leaves"
  | "people"
  | "glow"
  | "finale"
  | "leaving";

const STEPS: { phase: Phase; at: number }[] = [
  { phase: "dim", at: 0 },
  { phase: "soil", at: 180 },
  { phase: "seed", at: 850 },
  { phase: "roots", at: 2000 },
  { phase: "trunk", at: 2900 },
  { phase: "branches", at: 3800 },
  { phase: "leaves", at: 4550 },
  { phase: "people", at: 5400 },
  { phase: "glow", at: 6100 },
  { phase: "finale", at: 7000 },
  { phase: "leaving", at: 8600 },
];

const END_MS = 9600;

function reached(phase: Phase, target: Phase): boolean {
  const order: Phase[] = [
    "idle",
    "dim",
    "soil",
    "seed",
    "roots",
    "trunk",
    "branches",
    "leaves",
    "people",
    "glow",
    "finale",
    "leaving",
  ];
  return order.indexOf(phase) >= order.indexOf(target);
}

function leafClass(
  phase: Phase,
  delay: string,
  tone?: "dark" | "light"
): string {
  return [
    styles.leaf,
    tone === "dark" ? styles.leafDark : "",
    tone === "light" ? styles.leafLight : "",
    delay,
    reached(phase, "leaves") ? styles.leafVisible : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type Props = {
  size?: number;
};

export default function AppIconEasterEgg({ size = 44 }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [overlayReady, setOverlayReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase === "idle") {
      setOverlayReady(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setOverlayReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [phase === "idle"]);

  function start() {
    if (phase !== "idle") {
      return;
    }

    clearTimers();
    setOverlayReady(false);

    for (const step of STEPS) {
      timers.current.push(
        window.setTimeout(() => setPhase(step.phase), step.at)
      );
    }

    timers.current.push(
      window.setTimeout(() => {
        setPhase("idle");
      }, END_MS)
    );
  }

  const playing = phase !== "idle";
  const showDrawnTree = !reached(phase, "finale");
  const showFinale = reached(phase, "finale");

  const overlay =
    playing && mounted
      ? createPortal(
          <div
            className={[
              styles.overlay,
              phase === "leaving"
                ? styles.overlayLeaving
                : overlayReady
                  ? styles.overlayVisible
                  : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="presentation"
            aria-hidden="true"
          >
            <div className={styles.stage}>
              <div
                className={[
                  styles.soil,
                  reached(phase, "soil") ? styles.soilVisible : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              <div
                className={[
                  styles.seed,
                  phase === "seed" ? styles.seedFalling : "",
                  reached(phase, "roots") ? styles.seedGone : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              <div
                className={[
                  styles.tree,
                  showDrawnTree ? "" : styles.treeHidden,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <svg viewBox="0 0 280 400" aria-hidden="true">
                  <defs>
                    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff6c8" />
                      <stop offset="45%" stopColor="#f5d76e" />
                      <stop offset="100%" stopColor="#f0b429" stopOpacity="0.15" />
                    </radialGradient>
                    <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6a3f22" />
                      <stop offset="45%" stopColor="#8b5a2b" />
                      <stop offset="100%" stopColor="#5c3518" />
                    </linearGradient>
                  </defs>

                  <g
                    className={[
                      styles.sun,
                      reached(phase, "glow") ? styles.sunVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <line className={styles.sunRay} x1="140" y1="18" x2="140" y2="0" />
                    <line className={styles.sunRay} x1="175" y1="28" x2="192" y2="10" />
                    <line className={styles.sunRay} x1="105" y1="28" x2="88" y2="10" />
                    <line className={styles.sunRay} x1="198" y1="55" x2="218" y2="45" />
                    <line className={styles.sunRay} x1="82" y1="55" x2="62" y2="45" />
                    <circle className={styles.sunCore} cx="140" cy="70" r="52" />
                  </g>

                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 330 C120 345 88 352 62 348"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 330 C160 345 192 352 218 348"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 332 C132 350 140 360 148 355"
                  />

                  <g
                    className={[
                      styles.trunkGrow,
                      reached(phase, "trunk") ? styles.trunkVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <path
                      className={styles.trunk}
                      d="M122 332
                         C118 280 120 230 124 185
                         C126 155 128 130 132 108
                         C134 95 136 88 140 78
                         C144 88 146 95 148 108
                         C152 130 154 155 156 185
                         C160 230 162 280 158 332
                         C152 338 146 340 140 340
                         C134 340 128 338 122 332 Z"
                    />
                  </g>

                  <path
                    className={[
                      styles.branch,
                      styles.branchDelay1,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 160 C110 150 78 130 55 108"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchDelay2,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 145 C170 135 202 115 225 92"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchThin,
                      styles.branchDelay3,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 125 C118 110 100 88 92 62"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchThin,
                      styles.branchDelay4,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 118 C162 102 180 80 188 55"
                  />

                  {/* Leaf clusters – icon-like pointed ovals */}
                  <ellipse className={leafClass(phase, styles.leafDelay1, "light")} cx="48" cy="100" rx="16" ry="10" transform="rotate(-40 48 100)" />
                  <ellipse className={leafClass(phase, styles.leafDelay2)} cx="68" cy="118" rx="15" ry="9" transform="rotate(-28 68 118)" />
                  <ellipse className={leafClass(phase, styles.leafDelay3, "dark")} cx="42" cy="122" rx="13" ry="8" transform="rotate(-50 42 122)" />
                  <ellipse className={leafClass(phase, styles.leafDelay2, "light")} cx="232" cy="86" rx="16" ry="10" transform="rotate(38 232 86)" />
                  <ellipse className={leafClass(phase, styles.leafDelay3)} cx="214" cy="108" rx="15" ry="9" transform="rotate(26 214 108)" />
                  <ellipse className={leafClass(phase, styles.leafDelay4, "dark")} cx="238" cy="112" rx="13" ry="8" transform="rotate(48 238 112)" />
                  <ellipse className={leafClass(phase, styles.leafDelay4, "light")} cx="88" cy="55" rx="14" ry="9" transform="rotate(-18 88 55)" />
                  <ellipse className={leafClass(phase, styles.leafDelay5)} cx="192" cy="48" rx="14" ry="9" transform="rotate(16 192 48)" />
                  <ellipse className={leafClass(phase, styles.leafDelay5, "light")} cx="118" cy="42" rx="15" ry="10" transform="rotate(-8 118 42)" />
                  <ellipse className={leafClass(phase, styles.leafDelay6)} cx="162" cy="38" rx="15" ry="10" transform="rotate(8 162 38)" />
                  <ellipse className={leafClass(phase, styles.leafDelay6, "dark")} cx="140" cy="28" rx="18" ry="11" />
                  <ellipse className={leafClass(phase, styles.leafDelay7, "light")} cx="100" cy="78" rx="12" ry="8" transform="rotate(-22 100 78)" />
                  <ellipse className={leafClass(phase, styles.leafDelay7)} cx="180" cy="72" rx="12" ry="8" transform="rotate(20 180 72)" />
                  <ellipse className={leafClass(phase, styles.leafDelay8, "dark")} cx="70" cy="88" rx="11" ry="7" transform="rotate(-30 70 88)" />
                  <ellipse className={leafClass(phase, styles.leafDelay8, "light")} cx="210" cy="82" rx="11" ry="7" transform="rotate(28 210 82)" />

                  {/* Family person bubbles – like the icon */}
                  <g
                    className={[
                      styles.person,
                      styles.personDelay1,
                      reached(phase, "people") ? styles.personVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    transform="translate(118 48)"
                  >
                    <circle className={styles.personRing} cx="22" cy="22" r="22" />
                    <circle className={styles.personSilhouette} cx="14" cy="16" r="5" />
                    <circle className={styles.personSilhouette} cx="30" cy="16" r="5" />
                    <path
                      className={styles.personSilhouette}
                      d="M6 34 C6 26 12 22 14 22 C18 22 20 26 22 26 C24 26 26 22 30 22 C32 22 38 26 38 34 Z"
                    />
                  </g>

                  <g
                    className={[
                      styles.person,
                      styles.personDelay2,
                      reached(phase, "people") ? styles.personVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    transform="translate(42 88)"
                  >
                    <circle className={styles.personRing} cx="16" cy="16" r="16" />
                    <circle className={styles.personSilhouette} cx="16" cy="12" r="5" />
                    <path
                      className={styles.personSilhouette}
                      d="M6 28 C6 21 11 18 16 18 C21 18 26 21 26 28 Z"
                    />
                  </g>

                  <g
                    className={[
                      styles.person,
                      styles.personDelay3,
                      reached(phase, "people") ? styles.personVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    transform="translate(206 72)"
                  >
                    <circle className={styles.personRing} cx="16" cy="16" r="16" />
                    <circle className={styles.personSilhouette} cx="16" cy="12" r="5" />
                    <path
                      className={styles.personSilhouette}
                      d="M6 28 C6 21 11 18 16 18 C21 18 26 21 26 28 Z"
                    />
                  </g>

                  <g
                    className={[
                      styles.person,
                      styles.personDelay4,
                      reached(phase, "people") ? styles.personVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    transform="translate(58 128)"
                  >
                    <circle className={styles.personRing} cx="14" cy="14" r="14" />
                    <circle className={styles.personSilhouette} cx="14" cy="11" r="4" />
                    <path
                      className={styles.personSilhouette}
                      d="M5 24 C5 18 9 16 14 16 C19 16 23 18 23 24 Z"
                    />
                  </g>

                  <g
                    className={[
                      styles.person,
                      styles.personDelay5,
                      reached(phase, "people") ? styles.personVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    transform="translate(194 118)"
                  >
                    <circle className={styles.personRing} cx="14" cy="14" r="14" />
                    <circle className={styles.personSilhouette} cx="9" cy="10" r="2.2" />
                    <circle className={styles.personSilhouette} cx="19" cy="10" r="2.2" />
                    <circle className={styles.personSilhouette} cx="14" cy="11" r="4" />
                    <path
                      className={styles.personSilhouette}
                      d="M5 24 C5 18 9 16 14 16 C19 16 23 18 23 24 Z"
                    />
                  </g>
                </svg>
              </div>

              <div
                className={[
                  styles.finale,
                  showFinale ? styles.finaleVisible : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="" />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={playing}
        className="block shrink-0 rounded-lg opacity-95 transition hover:scale-105 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:cursor-default disabled:hover:scale-100"
        aria-label="MALBAT"
        title="MALBAT"
      >
        <Image
          src="/icon.png"
          alt=""
          width={size}
          height={size}
          className="rounded-md object-contain shadow-md shadow-black/35"
          style={{ width: size, height: size }}
        />
      </button>
      {overlay}
    </>
  );
}
