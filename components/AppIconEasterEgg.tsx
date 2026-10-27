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
                <svg viewBox="0 0 280 380" aria-hidden="true">
                  <defs>
                    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff8d0" />
                      <stop offset="55%" stopColor="#f5d76e" />
                      <stop offset="100%" stopColor="#f0b429" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5c3a1f" />
                      <stop offset="45%" stopColor="#8b5a2b" />
                      <stop offset="100%" stopColor="#4e3018" />
                    </linearGradient>
                  </defs>

                  <g>
                    <line
                      className={[
                        styles.glowRay,
                        reached(phase, "glow") ? styles.glowRayVisible : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      x1="140"
                      y1="22"
                      x2="140"
                      y2="4"
                    />
                    <line
                      className={[
                        styles.glowRay,
                        reached(phase, "glow") ? styles.glowRayVisible : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      x1="172"
                      y1="30"
                      x2="188"
                      y2="12"
                    />
                    <line
                      className={[
                        styles.glowRay,
                        reached(phase, "glow") ? styles.glowRayVisible : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      x1="108"
                      y1="30"
                      x2="92"
                      y2="12"
                    />
                    <circle
                      className={[
                        styles.glow,
                        reached(phase, "glow") ? styles.glowVisible : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      cx="140"
                      cy="72"
                      r="54"
                    />
                  </g>

                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 325 C122 340 90 348 64 344"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 325 C158 340 190 348 216 344"
                  />
                  <path
                    className={[
                      styles.roots,
                      reached(phase, "roots") ? styles.rootsVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 328 C134 345 140 355 148 350"
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
                      d="M124 328
                         C120 275 122 225 126 180
                         C128 150 130 125 134 100
                         C136 88 138 80 140 72
                         C142 80 144 88 146 100
                         C150 125 152 150 154 180
                         C158 225 160 275 156 328
                         C150 334 144 336 140 336
                         C136 336 130 334 124 328 Z"
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
                    d="M140 155 C112 148 82 132 58 108"
                  />
                  <path
                    className={[
                      styles.branch,
                      styles.branchDelay2,
                      reached(phase, "branches") ? styles.branchVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 142 C168 134 198 116 222 90"
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
                    d="M140 120 C120 108 105 88 96 62"
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
                    d="M140 115 C160 102 176 82 186 56"
                  />

                  {/* Teardrop-ish leaves */}
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay1,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M58 108 C48 98 42 88 48 80 C56 88 64 98 58 108 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay2,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M72 122 C60 112 54 100 62 92 C70 102 78 112 72 122 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDark,
                      styles.leafDelay3,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M48 124 C38 116 34 106 40 98 C48 106 54 116 48 124 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay2,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M222 92 C232 82 238 72 232 64 C224 72 216 82 222 92 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay3,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M208 108 C220 98 226 86 218 78 C210 88 202 98 208 108 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDark,
                      styles.leafDelay4,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M232 112 C242 104 246 94 240 86 C232 94 226 104 232 112 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay4,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M96 58 C88 48 84 38 92 32 C98 40 104 50 96 58 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay5,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M184 52 C192 42 196 32 188 26 C182 34 176 44 184 52 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay5,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M118 44 C110 34 108 24 118 18 C124 26 128 36 118 44 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay6,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M162 40 C170 30 172 20 162 14 C156 22 152 32 162 40 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDark,
                      styles.leafDelay6,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M140 34 C128 24 126 12 140 6 C154 12 152 24 140 34 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay7,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M102 82 C94 74 90 64 98 58 C104 66 110 74 102 82 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDelay7,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M178 76 C186 68 190 58 182 52 C176 60 170 68 178 76 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafDark,
                      styles.leafDelay8,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M78 96 C70 90 66 82 72 76 C78 82 84 90 78 96 Z"
                  />
                  <path
                    className={[
                      styles.leaf,
                      styles.leafLight,
                      styles.leafDelay8,
                      reached(phase, "leaves") ? styles.leafVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d="M202 88 C210 82 214 74 208 68 C202 74 196 82 202 88 Z"
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
