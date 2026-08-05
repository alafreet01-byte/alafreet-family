"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function Tree() {
  const treeRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (treeRef.current) treeRef.current.rotation.y += delta * 0.025;

    if (crownRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.15) * 0.018;
      crownRef.current.scale.setScalar(pulse);
    }
  });

  const branches = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => {
        const angle = (index / 34) * Math.PI * 2;
        return {
          angle,
          height: 1.35 + (index % 6) * 0.28,
          length: 1.25 + (index % 7) * 0.14,
          tilt: 0.26 + (index % 4) * 0.075,
        };
      }),
    [],
  );

  const leaves = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const phi = Math.acos(1 - 2 * ((index + 0.5) / 180));
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const radius = 1.75 + (index % 9) * 0.045;

        return {
          x: Math.cos(theta) * Math.sin(phi) * radius,
          y: 2.9 + Math.cos(phi) * radius * 0.82,
          z: Math.sin(theta) * Math.sin(phi) * radius,
          scale: 0.045 + (index % 5) * 0.011,
        };
      }),
    [],
  );

  return (
    <group ref={treeRef}>
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.76, 4.25, 30]} />
        <meshPhysicalMaterial
          color="#6c3c0a"
          emissive="#3c1800"
          emissiveIntensity={1.25}
          metalness={0.86}
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      <mesh position={[0, -2.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.085, 20, 220]} />
        <meshStandardMaterial color="#f0b743" emissive="#a55c00" emissiveIntensity={3.2} metalness={1} roughness={0.08} />
      </mesh>

      {branches.map((branch, index) => {
        const x = Math.cos(branch.angle) * 0.72;
        const z = Math.sin(branch.angle) * 0.72;

        return (
          <mesh
            key={index}
            position={[x, branch.height, z]}
            rotation={[Math.PI / 2 - branch.tilt, 0, -branch.angle + Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.025, 0.105, branch.length, 10]} />
            <meshStandardMaterial color="#8d5512" emissive="#522800" emissiveIntensity={1.2} metalness={0.84} roughness={0.2} />
          </mesh>
        );
      })}

      <group ref={crownRef}>
        {leaves.map((leaf, index) => (
          <mesh key={index} position={[leaf.x, leaf.y, leaf.z]} scale={leaf.scale}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
              color={index % 4 === 0 ? "#fff2aa" : "#e9b747"}
              emissive={index % 4 === 0 ? "#ffd95d" : "#a95b00"}
              emissiveIntensity={index % 4 === 0 ? 4.2 : 2.7}
              metalness={0.94}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>

      <Sparkles count={180} scale={[6.2, 7.8, 6.2]} size={2.8} speed={0.4} color="#ffd86f" opacity={0.9} />
    </group>
  );
}
