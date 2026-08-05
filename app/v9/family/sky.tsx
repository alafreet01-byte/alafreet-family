"use client";

import { Stars } from "@react-three/drei";

export default function Sky() {
  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 14, 38]} />
      <Stars radius={130} depth={75} count={7000} factor={4} saturation={0.2} fade speed={0.22} />
    </>
  );
}
