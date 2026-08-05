"use client";

import { Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Effects() {
  const fogOneRef = useRef<THREE.Mesh>(null);
  const fogTwoRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (fogOneRef.current) {
      fogOneRef.current.rotation.z += delta * 0.02;
      fogOneRef.current.position.x = Math.sin(time * 0.25) * 0.35;
    }

    if (fogTwoRef.current) {
      fogTwoRef.current.rotation.z -= delta * 0.015;
      fogTwoRef.current.position.z = Math.cos(time * 0.2) * 0.4;
    }
  });

  return (
    <>
      <Sparkles count={380} scale={[20, 11, 20]} size={2} speed={0.22} opacity={0.32} color="#ffd86f" />
      <Sparkles count={170} scale={[11, 7, 11]} size={4} speed={0.45} opacity={0.22} color="#fff4b0" />

      <mesh ref={fogOneRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.58, 0]}>
        <ringGeometry args={[1.8, 5.8, 180]} />
        <meshBasicMaterial color="#d7b35b" transparent opacity={0.075} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh ref={fogTwoRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.55, 0]}>
        <ringGeometry args={[2.4, 7.2, 180]} />
        <meshBasicMaterial color="#7a83ff" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <EffectComposer>
        <Bloom intensity={1.45} luminanceThreshold={0.15} luminanceSmoothing={0.8} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
