"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Camera() {
  const { camera } = useThree();
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const startTimeRef = useRef(0);
  const startPosition = useRef(new THREE.Vector3(0, 8.5, 17));
  const endPosition = useRef(new THREE.Vector3(0, 2.4, 10.5));
  const target = useRef(new THREE.Vector3(0, 0.7, 0));

  useEffect(() => {
    camera.position.copy(startPosition.current);
    camera.lookAt(target.current);
  }, [camera]);

  useFrame((state) => {
    if (!startedRef.current) {
      startedRef.current = true;
      startTimeRef.current = state.clock.elapsedTime;
    }
    if (finishedRef.current) return;

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const progress = Math.min(elapsed / 4.5, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(startPosition.current, endPosition.current, eased);
    camera.position.x += Math.sin(progress * Math.PI) * 0.65;
    camera.lookAt(target.current);

    if (progress >= 1) finishedRef.current = true;
  });

  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      minDistance={7}
      maxDistance={15}
      minPolarAngle={Math.PI / 3.4}
      maxPolarAngle={Math.PI / 1.75}
      target={[0, 0.7, 0]}
      autoRotate
      autoRotateSpeed={0.16}
    />
  );
}
