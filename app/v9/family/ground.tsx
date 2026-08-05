"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Ground() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += delta * 0.06;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.25) * 0.025;
    ringRef.current.scale.setScalar(pulse);
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.7, 0]} receiveShadow>
        <circleGeometry args={[28, 160]} />
        <meshStandardMaterial color="#090909" emissive="#3f2803" emissiveIntensity={0.17} metalness={0.2} roughness={0.92} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.66, 0]}>
        <torusGeometry args={[5.15, 0.11, 24, 320]} />
        <meshPhysicalMaterial color="#ffd76d" emissive="#ffb300" emissiveIntensity={4.5} metalness={1} roughness={0.04} clearcoat={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.67, 0]}>
        <torusGeometry args={[7.2, 0.025, 18, 280]} />
        <meshBasicMaterial color="#d8a53b" transparent opacity={0.2} />
      </mesh>
    </>
  );
}
