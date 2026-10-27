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

function Leaf({
  x,
  y,
  rotate = 0,
  size = 1,
  late = false,
  delayClass,
  visible,
}: {
  x: number;
  y: number;
  rotate?: number;
  size?: number;
  late?: boolean;
  delayClass: string;
  visible: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        className={[
          styles.leaf,
          late ? styles.leafLate : "",
          delayClass,
          visible ? styles.leafVisible : "",
        ]
          .filter(Boolean)
          .join(" ")}
        d={`M0 ${-16 * size} C${10 * size} ${-6 * size} ${10 * size} ${8 * size} 0 ${16 * size} C${-10 * size} ${8 * size} ${-10 * size} ${-6 * size} 0 ${-16 * size} Z`}
      />
    </g>
  );
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
                  <defs>
                    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff6c2" />
                      <stop offset="55%" stopColor="#f5d76e" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#f5d76e" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle
                    className={[
                      styles.glow,
                      reached(phase, "glow") ? styles.glowVisible : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    cx="130"
                    cy="68"
                    r="56"
                    fill="url(#sunGrad)"
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

                  <Leaf
                    x={52}
                    y={98}
                    rotate={-40}
                    delayClass={styles.leafDelay1}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={68}
                    y={118}
                    rotate={-22}
                    size={0.85}
                    late
                    delayClass={styles.leafDelay2}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={208}
                    y={78}
                    rotate={35}
                    delayClass={styles.leafDelay3}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={192}
                    y={100}
                    rotate={20}
                    size={0.85}
                    late
                    delayClass={styles.leafDelay4}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={98}
                    y={50}
                    rotate={-14}
                    size={0.9}
                    delayClass={styles.leafDelay5}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={162}
                    y={48}
                    rotate={12}
                    size={0.9}
                    late
                    delayClass={styles.leafDelay5}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={130}
                    y={38}
                    size={1.15}
                    late
                    delayClass={styles.leafDelay6}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={78}
                    y={88}
                    rotate={-28}
                    size={0.75}
                    late
                    delayClass={styles.leafDelay3}
                    visible={reached(phase, "leaves")}
                  />
                  <Leaf
                    x={182}
                    y={82}
                    rotate={26}
                    size={0.75}
                    delayClass={styles.leafDelay4}
                    visible={reached(phase, "leaves")}
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
