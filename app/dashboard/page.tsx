"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Billboard,
  Float,
  OrbitControls,
  Sparkles,
  Stars,
  Text,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { createClient } from "../../lib/supabase/client";

type Member = {
  id: string;
  name: string;
  role: string;
  angle: number;
  radius: number;
  height: number;
  color: string;
};

const members: Member[] = [
  { id: "khalifa", name: "خليفة", role: "الأب", angle: 0, radius: 4.15, height: 0.55, color: "#ffd76d" },
  { id: "amal", name: "أمل", role: "الأم", angle: 0.7, radius: 4.45, height: 0.9, color: "#ffb6df" },
  { id: "khalid", name: "خالد", role: "ابن", angle: 1.4, radius: 4.25, height: -0.05, color: "#83d1ff" },
  { id: "ahmed", name: "أحمد", role: "ابن", angle: 2.1, radius: 4.55, height: 0.55, color: "#ffc27a" },
  { id: "reem", name: "ريم", role: "ابنة", angle: 2.8, radius: 4.15, height: -0.25, color: "#dca6ff" },
  { id: "aisha", name: "عائشة", role: "ابنة", angle: 3.5, radius: 4.5, height: 0.35, color: "#ffabc2" },
  { id: "saud", name: "سعود", role: "ابن", angle: 4.2, radius: 4.25, height: 0.75, color: "#98e9c7" },
  { id: "fatima", name: "فاطمة", role: "ابنة", angle: 4.9, radius: 4.45, height: -0.05, color: "#ffd4ab" },
  { id: "mohammed", name: "محمد", role: "ابن", angle: 5.6, radius: 4.15, height: 0.3, color: "#cadcff" },
];

const worlds = [
  { label: "الأفراد", sub: "ملفات العائلة", icon: "◉", route: "/family" },
  { label: "الذكريات", sub: "الصور واللحظات", icon: "✦", route: "/memories" },
  { label: "المحادثات", sub: "الدردشة الخاصة", icon: "◌", route: "/chat" },
  { label: "المهام", sub: "تنظيم اليوم", icon: "✓", route: "/tasks" },
  { label: "المكافآت", sub: "النقاط والإنجازات", icon: "◆", route: "/rewards" },
  { label: "التقويم", sub: "المواعيد والأحداث", icon: "▦", route: "/calendar" },
];

function GoldenTree() {
  const root = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (root.current) root.current.rotation.y += delta * 0.045;
    if (crown.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.018;
      crown.current.scale.setScalar(pulse);
    }
  });

  const branches = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        return {
          angle,
          length: 1.45 + (i % 6) * 0.14,
          y: 1.55 + (i % 5) * 0.3,
          tilt: 0.25 + (i % 4) * 0.08,
        };
      }),
    [],
  );

  const leaves = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const phi = Math.acos(1 - 2 * ((i + 0.5) / 120));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const radius = 1.75 + (i % 8) * 0.045;
        return {
          x: Math.cos(theta) * Math.sin(phi) * radius,
          y: 2.9 + Math.cos(phi) * radius * 0.8,
          z: Math.sin(theta) * Math.sin(phi) * radius,
          scale: 0.055 + (i % 4) * 0.012,
        };
      }),
    [],
  );

  return (
    <group ref={root}>
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.38, 0.72, 4.2, 26]} />
        <meshPhysicalMaterial
          color="#70430e"
          emissive="#5b2e03"
          emissiveIntensity={1.65}
          metalness={0.93}
          roughness={0.22}
          clearcoat={1}
        />
      </mesh>

      <mesh position={[0, -2.67, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.085, 18, 200]} />
        <meshStandardMaterial
          color="#f0b743"
          emissive="#a55c00"
          emissiveIntensity={3.2}
          metalness={1}
          roughness={0.08}
        />
      </mesh>

      {branches.map((branch, i) => {
        const x = Math.cos(branch.angle) * 0.72;
        const z = Math.sin(branch.angle) * 0.72;
        return (
          <mesh
            key={i}
            position={[x, branch.y, z]}
            rotation={[
              Math.PI / 2 - branch.tilt,
              0,
              -branch.angle + Math.PI / 2,
            ]}
          >
            <cylinderGeometry args={[0.03, 0.095, branch.length, 10]} />
            <meshStandardMaterial
              color="#8d5512"
              emissive="#522800"
              emissiveIntensity={1.35}
              metalness={0.86}
              roughness={0.2}
            />
          </mesh>
        );
      })}

      <group ref={crown}>
        {leaves.map((leaf, i) => (
          <mesh key={i} position={[leaf.x, leaf.y, leaf.z]} scale={leaf.scale}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
              color={i % 4 === 0 ? "#fff3b1" : "#e8b648"}
              emissive={i % 4 === 0 ? "#ffd95d" : "#a95b00"}
              emissiveIntensity={i % 4 === 0 ? 4.2 : 2.7}
              metalness={0.94}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>

      <Sparkles count={150} scale={[6, 7.4, 6]} size={2.6} speed={0.38} color="#ffd86f" opacity={0.9} />
    </group>
  );
}

function MemberOrb({
  member,
  onSelect,
}: {
  member: Member;
  onSelect: (member: Member) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.y =
        member.height + Math.sin(state.clock.elapsedTime * 1.3 + member.angle) * 0.08;
    }
    if (halo.current) {
      const pulse = 1.5 + Math.sin(state.clock.elapsedTime * 2 + member.angle) * 0.12;
      halo.current.scale.setScalar(pulse);
    }
  });

  const x = Math.cos(member.angle) * member.radius;
  const z = Math.sin(member.angle) * member.radius;

  return (
    <group
      ref={group}
      position={[x, member.height, z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(member);
      }}
    >
      <Float speed={1.25} rotationIntensity={0.12} floatIntensity={0.2}>
        <mesh>
          <sphereGeometry args={[0.24, 34, 34]} />
          <meshPhysicalMaterial
            color={member.color}
            emissive={member.color}
            emissiveIntensity={2.8}
            metalness={0.84}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>

        <mesh ref={halo}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshBasicMaterial
            color={member.color}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      </Float>

      <Billboard position={[0, -0.62, 0]}>
        <group>
          <mesh position={[0, 0, -0.03]}>
            <planeGeometry args={[1.55, 0.55]} />
            <meshBasicMaterial color="#02030a" transparent opacity={0.76} />
          </mesh>

          <Text
            position={[0, 0.08, 0]}
            fontSize={0.22}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.012}
            outlineColor="#000000"
          >
            {member.name}
          </Text>

          <Text
            position={[0, -0.15, 0]}
            fontSize={0.11}
            color={member.color}
            anchorX="center"
            anchorY="middle"
          >
            {member.role}
          </Text>
        </group>
      </Billboard>
    </group>
  );
}

function FamilyOrbit({
  onSelect,
}: {
  onSelect: (member: Member) => void;
}) {
  const orbit = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (orbit.current) orbit.current.rotation.y += delta * 0.018;
  });

  return (
    <group ref={orbit}>
      <mesh rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[4.3, 0.009, 8, 320]} />
        <meshBasicMaterial color="#c99b38" transparent opacity={0.26} />
      </mesh>

      {members.map((member) => (
        <MemberOrb key={member.id} member={member} onSelect={onSelect} />
      ))}
    </group>
  );
}

function WorldScene({
  onSelect,
}: {
  onSelect: (member: Member) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 7, 6]} intensity={28} color="#ffc95c" />
      <pointLight position={[-6, 1, -3]} intensity={12} color="#506dff" />

      <Stars radius={120} depth={65} count={5600} factor={3.2} saturation={0.25} fade speed={0.2} />
      <GoldenTree />
      <FamilyOrbit onSelect={onSelect} />

      <EffectComposer>
        <Bloom intensity={1.55} luminanceThreshold={0.14} luminanceSmoothing={0.8} mipmapBlur />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.1}
      />
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checking, setChecking] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function protect() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    }

    protect();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function logout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#010208]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />
      </main>
    );
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#010208] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(112,72,12,0.18),transparent_35%),radial-gradient(circle_at_18%_20%,rgba(42,58,136,0.18),transparent_28%),linear-gradient(180deg,#010208_0%,#050714_55%,#010106_100%)]" />

      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 1.15, 10.2], fov: 48 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <WorldScene onSelect={setSelectedMember} />
        </Canvas>
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <div className="pointer-events-auto">
          <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-amber-200/45">
            Private Universe
          </p>
          <h1
            dir="ltr"
            className="mt-1 bg-gradient-to-b from-white via-amber-100 to-amber-500 bg-clip-text text-xl font-black tracking-[0.08em] text-transparent sm:text-2xl"
          >
            ALAFREET.AE
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-lg backdrop-blur-xl transition hover:border-amber-200/30"
        >
          ☰
        </button>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center px-4">
        <div className="rounded-full border border-white/10 bg-black/25 px-5 py-2 text-xs text-white/35 backdrop-blur-xl">
          أهلاً بكم في عالم العائلة
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 25, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 25, scale: 0.97 }}
            className="absolute right-4 top-20 z-30 w-[min(92vw,380px)] rounded-[28px] border border-amber-200/15 bg-[#050710]/86 p-4 shadow-2xl backdrop-blur-2xl sm:right-6"
          >
            <div className="grid grid-cols-2 gap-3">
              {worlds.map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => router.push(item.route)}
                  className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-right transition hover:border-amber-200/25 hover:bg-amber-200/[0.055]"
                >
                  <span className="text-xl text-amber-300">{item.icon}</span>
                  <strong className="mt-3 block text-sm">{item.label}</strong>
                  <span className="mt-1 block text-[10px] text-white/35">{item.sub}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={loggingOut}
              onClick={logout}
              className="mt-4 w-full rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <nav className="absolute inset-x-0 bottom-5 z-20 flex justify-center px-3">
        <div className="flex max-w-full gap-2 overflow-x-auto rounded-[26px] border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-2xl">
          {worlds.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => router.push(item.route)}
              className="min-w-[92px] rounded-2xl px-3 py-3 text-center transition hover:bg-amber-200/10"
            >
              <span className="block text-lg text-amber-300">{item.icon}</span>
              <strong className="mt-1 block text-[11px]">{item.label}</strong>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 35, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-[30px] border border-amber-200/15 bg-[#060811]/90 p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 text-2xl font-black shadow-[0_0_45px_rgba(255,200,90,0.18)]"
                style={{
                  background: `${selectedMember.color}22`,
                  color: selectedMember.color,
                }}
              >
                {selectedMember.name.slice(0, 1)}
              </div>

              <h2 className="mt-4 text-2xl font-black">{selectedMember.name}</h2>
              <p className="mt-1 text-sm text-white/40">{selectedMember.role}</p>

              <button
                type="button"
                onClick={() => router.push(`/family/${selectedMember.id}`)}
                className="mt-6 w-full rounded-2xl border border-amber-100/20 bg-gradient-to-l from-[#9c6810] via-[#e0ad45] to-[#87570b] px-5 py-4 font-black text-[#160f03]"
              >
                فتح الملف
              </button>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-white/55"
              >
                رجوع
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}