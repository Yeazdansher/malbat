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
  | "glow"
  | "leaving";

const STEPS: { phase: Phase; at: number }[] = [
  { phase: "dim", at: 0 },
  { phase: "soil", at: 200 },
  { phase: "seed", at: 900 },
  { phase: "roots", at: 2100 },
  { phase: "trunk", at: 3000 },
  { phase: "branches", at: 4000 },
  { phase: "leaves", at: 4700 },
  { phase: "glow", at: 5400 },
  { phase: "leaving", at: 6800 },
];

const END_MS = 7800;

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
    "glow",
    "leaving",
  ];
  return order.indexOf(phase) >= order.indexOf(target);
}

type Props = {
  size?: number;
};

export default function AppIconEasterEgg({ size = 44 }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [overlayReady, setOverlayReady] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                  reached(phase, "soil") && phase !== "leaving"
                    ? styles.soilVisible
                    : "",
                  phase === "leaving" ? styles.soilVisible : "",
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

              <div className={styles.tree}>
                <svg viewBox="0 0 260 360" aria-hidden="true">
                  <circle
                    className={[
                      styles.glow,
                      reached(phase, "glow") ? styles.glowVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    cx="130"
                    cy="70"
                    r="48"
                  />

                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M130 330 C118 345 95 352 78 355"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M130 330 C142 345 165 352 182 355"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M130 332 C125 348 130 355 130 360"
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
                      d="M118 330 C116 250 120 180 124 120 C126 100 128 85 130 70 C132 85 134 100 136 120 C140 180 144 250 142 330 Z"
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
                    d="M130 150 C100 140 75 125 55 105"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchDelay2,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M130 130 C160 120 185 105 205 85"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchDelay3,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M130 110 C115 95 105 75 100 55"
                  />

                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay1,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -16 C10 -6 10 8 0 16 C-10 8 -10 -6 0 -16 Z"
                    transform="translate(52 98) rotate(-35)"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLate,
                      styles.leafDelay2,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -13 C8 -5 8 7 0 13 C-8 7 -8 -5 0 -13 Z"
                    transform="translate(70 118) rotate(-20)"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay3,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -16 C10 -6 10 8 0 16 C-10 8 -10 -6 0 -16 Z"
                    transform="translate(208 78) rotate(30)"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLate,
                      styles.leafDelay4,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -13 C8 -5 8 7 0 13 C-8 7 -8 -5 0 -13 Z"
                    transform="translate(190 100) rotate(18)"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay5,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -15 C9 -5 9 7 0 15 C-9 7 -9 -5 0 -15 Z"
                    transform="translate(98 48) rotate(-12)"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLate,
                      styles.leafDelay6,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M0 -18 C12 -6 12 10 0 18 C-12 10 -12 -6 0 -18 Z"
                    transform="translate(130 42)"
                  />
                </svg>
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
