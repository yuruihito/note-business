"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { OfficeStatusResponse, DeptStatus } from "../api/office-status/route";
import {
  PERSONALITIES,
  ROLE_LABELS,
  pickIdleLine,
  type OfficeDeptKey,
} from "@/lib/office-flavor";
import RequestModal from "./request-modal";
import DetailPanel from "./detail-panel";
import NameSettings from "./name-settings";
import HudPanel from "./hud-panel";

type Vec3 = [number, number, number];
type Waypoint = { pos: Vec3; sit?: boolean };

// Desks are arranged in one neat, evenly-spaced row.
const CMO_DESK: Vec3 = [-5, 0, 2.5];
const SECRETARY_DESK: Vec3 = [0, 0, 2.5];
const CFO_DESK: Vec3 = [5, 0, 2.5];
const MEETING: Vec3 = [0, 0, -2];
const CEO_SPAWN: Vec3 = [0, 0, 1];

const DESKS: Record<OfficeDeptKey, Vec3> = {
  cmo: CMO_DESK,
  cfo: CFO_DESK,
  secretary: SECRETARY_DESK,
};

// Distinct hairstyles so each member is recognizable at a glance, not just by color.
const LOOKS: Record<OfficeDeptKey, { hair: HairStyle; glasses?: boolean }> = {
  cmo: { hair: "ponytail" },
  cfo: { hair: "short", glasses: true },
  secretary: { hair: "bun" },
};

// Each department gets its own exclusive zone for idle wandering so
// characters never cross paths or stack on top of one another.
const IDLE_POOLS: Record<OfficeDeptKey, Waypoint[]> = {
  cmo: [
    { pos: [-0.7, 0, 4.7], sit: true },
    { pos: [-0.7, 0, 4.7], sit: true },
    { pos: [-2.3, 0, 3.7], sit: false },
    { pos: [-1.2, 0, 3.9], sit: false },
  ],
  cfo: [
    { pos: [0.7, 0, 4.7], sit: true },
    { pos: [0.7, 0, 4.7], sit: true },
    { pos: [2.3, 0, 3.7], sit: false },
    { pos: [1.2, 0, 3.9], sit: false },
  ],
  secretary: [
    { pos: [-6.8, 0, -3.6], sit: false },
    { pos: [-6.0, 0, -3.0], sit: false },
    { pos: [-7.0, 0, -2.4], sit: false },
  ],
};

const INTERACT_DISTANCE = 2.2;
const MOVE_SPEED = 2.6; // world units / second
const ROOM_BOUNDS = { minX: -7.4, maxX: 7.4, minZ: -4.4, maxZ: 4.4 };

const DEFAULT_STATUS: OfficeStatusResponse = {
  cmo: { status: "idle", message: "読み込み中...", link: null },
  cfo: { status: "idle", message: "読み込み中...", link: null },
  secretary: { status: "idle", message: "読み込み中...", link: null },
  names: { cmo: "CMO", cfo: "CFO", ceo: "社長", secretary: "秘書" },
  activeRequest: null,
  draftIdeas: [],
  pendingRequestCount: 0,
  suggestHiring: false,
  recentActivity: [],
};

function deskChairSpot(desk: Vec3): Vec3 {
  // The desk's monitor faces +z, so the chair sits just outside the desk's
  // footprint on that side instead of on top of the desk itself.
  return [desk[0], 0, desk[2] + 0.55];
}

function desiredWaypoints(status: DeptStatus, dept: OfficeDeptKey): Waypoint[] {
  if (status.status === "working") {
    // A single seated spot: no waypoint switching while working, so there's
    // no jitter — just the idle bob animation for a sense of life.
    return [{ pos: deskChairSpot(DESKS[dept]), sit: true }];
  }
  return IDLE_POOLS[dept];
}

function pickNextIndex(poolSize: number, currentIndex: number) {
  if (poolSize <= 1) return 0;
  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * poolSize);
  }
  return next;
}

type MoveState = {
  x: number;
  z: number;
  waypoints: Waypoint[];
  waypointIndex: number;
  waitUntil: number;
  mode: string;
  sitting: boolean;
};

function useKeyState() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
}

function Desk({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.8]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0, 0.62, -0.25]} castShadow>
        <boxGeometry args={[0.5, 0.32, 0.03]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.62, -0.25]}>
        <boxGeometry args={[0.44, 0.26, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.4, 8]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.32, 0.6, 8]} />
        <meshStandardMaterial color="#2f7a4d" />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <coneGeometry args={[0.24, 0.45, 8]} />
        <meshStandardMaterial color="#3f9a63" />
      </mesh>
    </group>
  );
}

function Bookshelf({ position }: { position: Vec3 }) {
  const colors = ["#dc2626", "#2563eb", "#f59e0b", "#16a34a", "#7c3aed"];
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.8, 0.35]} />
        <meshStandardMaterial color="#78542e" />
      </mesh>
      {[0.4, 0.9, 1.4].map((y, row) => (
        <group key={row} position={[0, y, 0.2]}>
          {colors.map((c, i) => (
            <mesh key={i} position={[-0.55 + i * 0.27, 0, 0]} castShadow>
              <boxGeometry args={[0.22, 0.32, 0.06]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#e7ddc8" />
      </mesh>

      {/* Back wall with wainscoting */}
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <boxGeometry args={[16, 3, 0.15]} />
        <meshStandardMaterial color="#f4efe4" />
      </mesh>
      <mesh position={[0, 0.45, -4.92]}>
        <boxGeometry args={[16, 0.9, 0.03]} />
        <meshStandardMaterial color="#c9a876" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-8, 1.5, 0]} receiveShadow>
        <boxGeometry args={[0.15, 3, 10]} />
        <meshStandardMaterial color="#f4efe4" />
      </mesh>
      <mesh position={[-7.92, 0.45, 0]}>
        <boxGeometry args={[0.03, 0.9, 10]} />
        <meshStandardMaterial color="#c9a876" />
      </mesh>

      {/* Window */}
      <mesh position={[3.4, 1.9, -4.9]}>
        <boxGeometry args={[2.6, 1.2, 0.05]} />
        <meshStandardMaterial color="#bfe3ee" emissive="#bfe3ee" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[3.4, 1.9, -4.87]}>
        <boxGeometry args={[0.06, 1.2, 0.02]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[3.4, 1.9, -4.87]}>
        <boxGeometry args={[2.6, 0.06, 0.02]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>

      {/* Whiteboard */}
      <mesh position={[-2.6, 1.7, -4.9]}>
        <boxGeometry args={[1.7, 1.05, 0.05]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[-2.6, 1.7, -4.86]}>
        <boxGeometry args={[1.55, 0.9, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Pendant lights */}
      <mesh position={[-5, 2.85, 2.5]}>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[5, 2.85, 2.5]}>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[0, 0.01, 4.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 24]} />
        <meshStandardMaterial color="#b9d8c9" />
      </mesh>
      <mesh position={[0, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial color="#cbd5f5" />
      </mesh>

      <mesh position={[0, 0.35, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.06, 24]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>
      <mesh position={[0, 0.15, -2]}>
        <cylinderGeometry args={[0.1, 0.15, 0.3, 12]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>

      <mesh position={[0, 0.28, 4.9]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.5, 0.7]} />
        <meshStandardMaterial color="#c67c4e" />
      </mesh>
      <mesh position={[0, 0.22, 3.7]} castShadow>
        <boxGeometry args={[1, 0.3, 0.5]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>

      <Desk position={CMO_DESK} color={PERSONALITIES.cmo.color} />
      <Desk position={CFO_DESK} color={PERSONALITIES.cfo.color} />
      <Desk position={SECRETARY_DESK} color={PERSONALITIES.secretary.color} />
      <Bookshelf position={[-7.2, 0, -4.2]} />
      <Plant position={[7, 0, -4.2]} />
      <Plant position={[-7, 0, 4.4]} />
      <Plant position={[7, 0, 4.4]} />
      <Plant position={[6.8, 0, -3.6]} />
    </group>
  );
}

type HairStyle = "none" | "ponytail" | "short" | "bun";

function Avatar({
  color,
  crown,
  hair = "none",
  glasses = false,
}: {
  color: string;
  crown?: boolean;
  hair?: HairStyle;
  glasses?: boolean;
}) {
  return (
    <group>
      {/* Body (kept small relative to head for a chibi look) */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.26, 0.32, 4, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color="#f8ddb8" />
      </mesh>
      {/* Eyes with a tiny sparkle highlight */}
      <mesh position={[-0.12, 1.2, 0.29]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0.12, 1.2, 0.29]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[-0.1, 1.23, 0.32]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.14, 1.23, 0.32]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Blush */}
      <mesh position={[-0.2, 1.1, 0.26]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#f4a3b8" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0.2, 1.1, 0.26]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#f4a3b8" transparent opacity={0.55} />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 1.05, 0.32]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.012, 0.08, 4, 6]} />
        <meshStandardMaterial color="#b5654f" />
      </mesh>
      {/* Hair (shape varies per role so silhouettes read as distinct people) */}
      {(hair === "short" || hair === "ponytail" || hair === "bun") && (
        <mesh position={[0, 1.33, -0.02]} castShadow>
          <sphereGeometry args={[0.345, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      )}
      {hair === "ponytail" && (
        <mesh position={[0, 1.12, -0.33]} rotation={[0.7, 0, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.26, 4, 8]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      )}
      {hair === "bun" && (
        <mesh position={[0, 1.52, -0.12]} castShadow>
          <sphereGeometry args={[0.11, 10, 10]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      )}
      {glasses && (
        <>
          <mesh position={[-0.12, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.065, 0.012, 8, 16]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh position={[0.12, 1.2, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.065, 0.012, 8, 16]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh position={[0, 1.2, 0.31]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
        </>
      )}
      {crown && (
        <mesh castShadow position={[0, 1.48, 0]}>
          <coneGeometry args={[0.17, 0.22, 6]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      )}
    </group>
  );
}

function NpcCharacter({
  dept,
  name,
  status,
  posRef,
  onSelect,
}: {
  dept: OfficeDeptKey;
  name: string;
  status: DeptStatus;
  posRef: React.MutableRefObject<{ x: number; z: number }>;
  onSelect: () => void;
}) {
  const initialSpot = deskChairSpot(DESKS[dept]);
  const groupRef = useRef<THREE.Group>(null);
  const moveRef = useRef<MoveState>({
    x: initialSpot[0],
    z: initialSpot[2],
    waypoints: desiredWaypoints(status, dept),
    waypointIndex: 0,
    waitUntil: 0,
    mode: status.status,
    sitting: true,
  });
  const bobSeed = useRef(0);
  const [bubbleText, setBubbleText] = useState(status.message);
  const [bubbleKind, setBubbleKind] = useState<"working" | "idle" | "chatter">(
    status.status
  );
  const chatterUntilRef = useRef(0);
  const nextChatterAtRef = useRef(0);

  useEffect(() => {
    bobSeed.current = Math.random() * 1000;
  }, []);

  useEffect(() => {
    if (moveRef.current.mode !== status.status) {
      moveRef.current.waypoints = desiredWaypoints(status, dept);
      moveRef.current.waypointIndex = 0;
      moveRef.current.waitUntil = 0;
      moveRef.current.mode = status.status;
    }
    if (chatterUntilRef.current < performance.now()) {
      setBubbleText(status.message);
      setBubbleKind(status.status);
    }
  }, [status, dept]);

  useEffect(() => {
    if (status.status !== "idle") return;
    nextChatterAtRef.current =
      performance.now() + 4000 + Math.random() * 6000;
  }, [status.status]);

  useFrame((state, delta) => {
    const now = performance.now();
    const m = moveRef.current;

    if (status.status === "idle" && now >= nextChatterAtRef.current) {
      setBubbleText(pickIdleLine(dept));
      setBubbleKind("chatter");
      chatterUntilRef.current = now + 4000;
      nextChatterAtRef.current = now + 8000 + Math.random() * 7000;
    } else if (bubbleKind === "chatter" && now >= chatterUntilRef.current) {
      setBubbleText(status.message);
      setBubbleKind(status.status);
    }

    if (now >= m.waitUntil) {
      const target = m.waypoints[m.waypointIndex];
      const dx = target.pos[0] - m.x;
      const dz = target.pos[2] - m.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        m.sitting = !!target.sit;
        m.waypointIndex = pickNextIndex(m.waypoints.length, m.waypointIndex);
        m.waitUntil =
          now + (target.sit ? 3500 + Math.random() * 4500 : 2000 + Math.random() * 2500);
      } else {
        m.sitting = false;
        const step = Math.min(MOVE_SPEED * delta, dist);
        m.x += (dx / dist) * step;
        m.z += (dz / dist) * step;
      }
    }

    posRef.current.x = m.x;
    posRef.current.z = m.z;

    const bob = Math.sin(state.clock.elapsedTime * 3 + bobSeed.current) * 0.03;
    const sitOffset = m.sitting ? -0.22 : 0;
    groupRef.current?.position.set(m.x, bob + sitOffset, m.z);
  });

  return (
    <group ref={groupRef}>
      <Avatar
        color={PERSONALITIES[dept].color}
        hair={LOOKS[dept].hair}
        glasses={LOOKS[dept].glasses}
      />
      <mesh
        position={[0, 0.9, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.9, 0]} center pointerEvents="none">
        <div className={`office-bubble ${bubbleKind}`}>
          <div className="office-bubble-head">
            <div>
              <strong>{name}</strong>
              <div className="office-role-label">{ROLE_LABELS[dept]}</div>
            </div>
            <span className={`office-status-pill ${status.status}`}>
              {status.status === "working" ? "作業中" : "休憩中"}
            </span>
          </div>
          <span className="office-bubble-msg">{bubbleText}</span>
        </div>
      </Html>
    </group>
  );
}

function CeoCharacter({
  name,
  posRef,
  keys,
}: {
  name: string;
  posRef: React.MutableRefObject<{ x: number; z: number }>;
  keys: React.MutableRefObject<Record<string, boolean>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bobSeed = useRef(0);

  useEffect(() => {
    bobSeed.current = Math.random() * 1000;
  }, []);

  useFrame((state, delta) => {
    const k = keys.current;
    let dx = 0;
    let dz = 0;
    if (k["w"] || k["arrowup"]) dz -= 1;
    if (k["s"] || k["arrowdown"]) dz += 1;
    if (k["a"] || k["arrowleft"]) dx -= 1;
    if (k["d"] || k["arrowright"]) dx += 1;

    let moving = false;
    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx = (dx / len) * MOVE_SPEED * delta;
      dz = (dz / len) * MOVE_SPEED * delta;
      posRef.current.x = THREE.MathUtils.clamp(
        posRef.current.x + dx,
        ROOM_BOUNDS.minX,
        ROOM_BOUNDS.maxX
      );
      posRef.current.z = THREE.MathUtils.clamp(
        posRef.current.z + dz,
        ROOM_BOUNDS.minZ,
        ROOM_BOUNDS.maxZ
      );
      moving = true;
    }

    const bob = moving
      ? Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.05
      : Math.sin(state.clock.elapsedTime * 2 + bobSeed.current) * 0.02;
    groupRef.current?.position.set(posRef.current.x, bob, posRef.current.z);
  });

  return (
    <group ref={groupRef}>
      <Avatar color="#a78bfa" crown />
      <Html position={[0, 1.9, 0]} center pointerEvents="none">
        <div className="office-bubble idle">
          <div className="office-bubble-head">
            <div>
              <strong>{name}</strong>
              <div className="office-role-label">{ROLE_LABELS.ceo}</div>
            </div>
          </div>
          <span className="office-bubble-msg">WASDで移動</span>
        </div>
      </Html>
    </group>
  );
}

function SceneLoop({
  cmoPos,
  cfoPos,
  ceoPos,
  onNearbyChange,
}: {
  cmoPos: React.MutableRefObject<{ x: number; z: number }>;
  cfoPos: React.MutableRefObject<{ x: number; z: number }>;
  ceoPos: React.MutableRefObject<{ x: number; z: number }>;
  onNearbyChange: (dept: OfficeDeptKey | null) => void;
}) {
  const lastNearby = useRef<OfficeDeptKey | null>(null);

  useFrame(() => {
    const dCmo = Math.hypot(
      ceoPos.current.x - cmoPos.current.x,
      ceoPos.current.z - cmoPos.current.z
    );
    const dCfo = Math.hypot(
      ceoPos.current.x - cfoPos.current.x,
      ceoPos.current.z - cfoPos.current.z
    );

    let nearby: OfficeDeptKey | null = null;
    if (dCmo < INTERACT_DISTANCE && dCmo <= dCfo) nearby = "cmo";
    else if (dCfo < INTERACT_DISTANCE) nearby = "cfo";

    if (nearby !== lastNearby.current) {
      lastNearby.current = nearby;
      onNearbyChange(nearby);
    }
  });

  return null;
}

export default function OfficeScene3D() {
  const [status, setStatus] = useState<OfficeStatusResponse>(DEFAULT_STATUS);
  const [nearbyDept, setNearbyDept] = useState<OfficeDeptKey | null>(null);
  const [selectedDept, setSelectedDept] = useState<OfficeDeptKey | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const cmoPos = useRef({ x: CMO_DESK[0], z: CMO_DESK[2] });
  const cfoPos = useRef({ x: CFO_DESK[0], z: CFO_DESK[2] });
  const secretaryPos = useRef({ x: SECRETARY_DESK[0], z: SECRETARY_DESK[2] });
  const ceoPos = useRef({ x: CEO_SPAWN[0], z: CEO_SPAWN[2] });
  const keys = useKeyState();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/office-status", { cache: "no-store" });
        if (!res.ok) return;
        const data: OfficeStatusResponse = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // 通信エラーは無視し、次回のポーリングに委ねる
      }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "e" && nearbyDept) {
        setShowRequestModal(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearbyDept]);

  const handleNearbyChange = useCallback((dept: OfficeDeptKey | null) => {
    setNearbyDept(dept);
  }, []);

  return (
    <div className="office-layout">
      <div className="office-main">
      <div className="office-toolbar">
        <button type="button" className="secondary" onClick={() => setShowSettings(true)}>
          ⚙ 名前を編集
        </button>
      </div>

      <div className="office-wrap">
        <Canvas shadows camera={{ position: [9, 8, 11], fov: 42 }}>
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[6, 10, 4]}
            intensity={1.1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Room />
          <NpcCharacter
            dept="cmo"
            name={status.names.cmo}
            status={status.cmo}
            posRef={cmoPos}
            onSelect={() => setSelectedDept("cmo")}
          />
          <NpcCharacter
            dept="cfo"
            name={status.names.cfo}
            status={status.cfo}
            posRef={cfoPos}
            onSelect={() => setSelectedDept("cfo")}
          />
          <NpcCharacter
            dept="secretary"
            name={status.names.secretary}
            status={status.secretary}
            posRef={secretaryPos}
            onSelect={() => setSelectedDept("secretary")}
          />
          <CeoCharacter name={status.names.ceo} posRef={ceoPos} keys={keys} />
          <SceneLoop
            cmoPos={cmoPos}
            cfoPos={cfoPos}
            ceoPos={ceoPos}
            onNearbyChange={handleNearbyChange}
          />
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={18}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>

        {nearbyDept && !showRequestModal && (
          <div className="office-hint">
            Eキーで{status.names[nearbyDept]}に話しかける
          </div>
        )}
      </div>

      <p className="office-controls-hint">
        ドラッグでカメラ回転・スクロールでズーム / WASDまたは矢印キーで社長アバターを移動
      </p>

      {selectedDept && (
        <DetailPanel
          name={status.names[selectedDept]}
          role={ROLE_LABELS[selectedDept]}
          trait={PERSONALITIES[selectedDept].trait}
          status={status[selectedDept]}
          onClose={() => setSelectedDept(null)}
        />
      )}
      </div>

      <HudPanel status={status} />

      {showRequestModal && (
        <RequestModal onClose={() => setShowRequestModal(false)} />
      )}
      {showSettings && (
        <NameSettings names={status.names} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
