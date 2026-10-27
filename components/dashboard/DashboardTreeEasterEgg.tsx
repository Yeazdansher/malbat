"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./DashboardTreeEasterEgg.module.css";

const PLAY_MS = 6200;
const FADE_MS = 900;

export default function DashboardTreeEasterEgg() {
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  function start() {
    if (playing) {
      return;
    }

    clearTimers();
    setLeaving(false);
    setPlaying(true);

    timers.current.push(
      window.setTimeout(() => {
        setLeaving(true);
        timers.current.push(
          window.setTimeout(() => {
            setPlaying(false);
            setLeaving(false);
          }, FADE_MS)
        );
      }, PLAY_MS)
    );
  }

  return (
    <>
      <footer className="mt-12 flex justify-center pb-8">
        <button
          type="button"
          onClick={start}
          disabled={playing}
          className="rounded-2xl opacity-90 transition hover:scale-105 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 disabled:cursor-default disabled:hover:scale-100"
          aria-label="MALBAT"
          title="MALBAT"
        >
          <Image
            src="/icon.png"
            alt=""
            width={72}
            height={72}
            className="rounded-xl shadow-lg shadow-black/30"
          />
        </button>
      </footer>

      {playing && (
        <div
          className={`${styles.overlay} ${leaving ? styles.leaving : ""}`}
          role="presentation"
          aria-hidden="true"
        >
          <div className={styles.stage}>
            <div className={styles.soil} />
            <div className={styles.seed} />
            <div className={styles.tree}>
              <svg viewBox="0 0 260 360" aria-hidden="true">
                <circle className={styles.glow} cx="130" cy="70" r="48" />

                <path
                  className={styles.roots}
                  d="M130 330 C118 345 95 352 78 355"
                />
                <path
                  className={styles.roots}
                  d="M130 330 C142 345 165 352 182 355"
                />
                <path
                  className={styles.roots}
                  d="M130 332 C125 348 130 355 130 360"
                />

                <g className={styles.trunkGrow}>
                  <path
                    className={styles.trunk}
                    d="M118 330 C116 250 120 180 124 120 C126 100 128 85 130 70 C132 85 134 100 136 120 C140 180 144 250 142 330 Z"
                  />
                </g>

                <path
                  className={`${styles.branch} ${styles.branchA}`}
                  d="M130 150 C100 140 75 125 55 105"
                />
                <path
                  className={`${styles.branch} ${styles.branchB}`}
                  d="M130 130 C160 120 185 105 205 85"
                />
                <path
                  className={`${styles.branch} ${styles.branchC}`}
                  d="M130 110 C115 95 105 75 100 55"
                />

                <ellipse
                  className={`${styles.leaf} ${styles.leafA}`}
                  cx="52"
                  cy="98"
                  rx="22"
                  ry="14"
                  transform="rotate(-35 52 98)"
                />
                <ellipse
                  className={`${styles.leaf} ${styles.leafLate} ${styles.leafB}`}
                  cx="70"
                  cy="118"
                  rx="18"
                  ry="12"
                  transform="rotate(-20 70 118)"
                />
                <ellipse
                  className={`${styles.leaf} ${styles.leafC}`}
                  cx="208"
                  cy="78"
                  rx="22"
                  ry="14"
                  transform="rotate(30 208 78)"
                />
                <ellipse
                  className={`${styles.leaf} ${styles.leafLate} ${styles.leafD}`}
                  cx="190"
                  cy="100"
                  rx="18"
                  ry="12"
                  transform="rotate(18 190 100)"
                />
                <ellipse
                  className={`${styles.leaf} ${styles.leafE}`}
                  cx="98"
                  cy="48"
                  rx="20"
                  ry="13"
                  transform="rotate(-12 98 48)"
                />
                <ellipse
                  className={`${styles.leaf} ${styles.leafLate} ${styles.leafF}`}
                  cx="130"
                  cy="42"
                  rx="28"
                  ry="18"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
