"use client";

import { useEffect, useRef, useState } from "react";
import type { DeptStatus } from "../api/office-status/route";

const W = 200;
const H = 120;

type Waypoint = { x: number; y: number };

type Character = {
  name: "cmo" | "cfo";
  color: string;
  x: number;
  y: number;
  waypoints: Waypoint[];
  waypointIndex: number;
  waitUntil: number;
  speed: number; // low-res px per second
  bobSeed: number;
  moving: boolean;
};

function makeCharacter(
  name: Character["name"],
  color: string,
  waypoints: Waypoint[]
): Character {
  return {
    name,
    color,
    x: waypoints[0].x,
    y: waypoints[0].y,
    waypoints,
    waypointIndex: 0,
    waitUntil: 0,
    speed: 18,
    bobSeed: Math.random() * 1000,
    moving: false,
  };
}

function drawRoom(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#e7ddc8";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#cfc3a5";
  ctx.fillRect(0, 0, W, 10);

  ctx.fillStyle = "#a9d4e0";
  ctx.fillRect(20, 14, 20, 14);
  ctx.fillRect(160, 14, 20, 14);

  ctx.fillStyle = "#b9d8c9";
  ctx.fillRect(70, 45, 60, 30);

  ctx.fillStyle = "#8b5e3c";
  ctx.fillRect(18, 85, 30, 14);
  ctx.fillStyle = "#5b3a24";
  ctx.fillRect(18, 85, 30, 3);

  ctx.fillStyle = "#8b5e3c";
  ctx.fillRect(152, 85, 30, 14);
  ctx.fillStyle = "#5b3a24";
  ctx.fillRect(152, 85, 30, 3);
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  c: Character,
  t: number
) {
  const bob = c.moving
    ? Math.sin(t / 120 + c.bobSeed) * 1.2
    : Math.sin(t / 500 + c.bobSeed) * 0.5;
  const x = Math.round(c.x);
  const y = Math.round(c.y + bob);

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x - 4, y + 9, 8, 2);

  const legOffset = c.moving
    ? Math.floor(t / 150) % 2 === 0
      ? 1
      : -1
    : 0;
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(x - 3, y + 4, 2, 5 + legOffset);
  ctx.fillRect(x + 1, y + 4, 2, 5 - legOffset);

  ctx.fillStyle = c.color;
  ctx.fillRect(x - 4, y - 3, 8, 8);

  ctx.fillStyle = "#f3d9b1";
  ctx.fillRect(x - 3, y - 10, 6, 6);

  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(x - 3, y - 10, 6, 2);
}

const IDLE_STATUS: { cmo: DeptStatus; cfo: DeptStatus } = {
  cmo: { status: "idle", message: "読み込み中..." },
  cfo: { status: "idle", message: "読み込み中..." },
};

export default function OfficeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charactersRef = useRef<Character[]>([]);
  const cmoBubbleRef = useRef<HTMLDivElement>(null);
  const cfoBubbleRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(IDLE_STATUS);

  useEffect(() => {
    charactersRef.current = [
      makeCharacter("cmo", "#2dd4bf", [
        { x: 33, y: 88 },
        { x: 60, y: 92 },
        { x: 95, y: 55 },
        { x: 60, y: 92 },
      ]),
      makeCharacter("cfo", "#fb923c", [
        { x: 167, y: 88 },
        { x: 140, y: 92 },
        { x: 105, y: 55 },
        { x: 140, y: 92 },
      ]),
    ];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();

    const bubbleRefs = { cmo: cmoBubbleRef, cfo: cfoBubbleRef };

    function step(now: number) {
      const dt = Math.min(now - last, 100);
      last = now;

      for (const c of charactersRef.current) {
        c.moving = false;
        if (now >= c.waitUntil) {
          const target = c.waypoints[c.waypointIndex];
          const dx = target.x - c.x;
          const dy = target.y - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1) {
            c.waypointIndex = (c.waypointIndex + 1) % c.waypoints.length;
            c.waitUntil = now + 2000 + Math.random() * 3000;
          } else {
            c.moving = true;
            const move = (c.speed * dt) / 1000;
            const clamped = Math.min(move, dist);
            c.x += (dx / dist) * clamped;
            c.y += (dy / dist) * clamped;
          }
        }

        const bubble = bubbleRefs[c.name].current;
        if (bubble) {
          bubble.style.left = `${(c.x / W) * 100}%`;
          bubble.style.top = `${((c.y - 16) / H) * 100}%`;
        }
      }

      if (ctx) {
        ctx.clearRect(0, 0, W, H);
        drawRoom(ctx);
        for (const c of charactersRef.current) {
          drawCharacter(ctx, c, now);
        }
      }

      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/office-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // 一時的な通信エラーは無視し、次回のポーリングに委ねる
      }
    }

    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="office-wrap">
      <canvas ref={canvasRef} width={W} height={H} className="office-canvas" />
      <div ref={cmoBubbleRef} className={`office-bubble ${status.cmo.status}`}>
        <strong>CMO</strong>
        <span>{status.cmo.message}</span>
      </div>
      <div ref={cfoBubbleRef} className={`office-bubble ${status.cfo.status}`}>
        <strong>CFO</strong>
        <span>{status.cfo.message}</span>
      </div>
    </div>
  );
}
