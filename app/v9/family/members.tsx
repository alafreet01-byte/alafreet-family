"use client";

import { Billboard, Float, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { familyMembers, type FamilyMember } from "./data";

function MemberOrb({
  member,
  onSelect,
}: {
  member: FamilyMember;
  onSelect: (member: FamilyMember) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const basePosition = useMemo(
    () =>
      new THREE.Vector3(
        Math.cos(member.angle) * member.radius,
        member.height,
        Math.sin(member.angle) * member.radius,
      ),
    [member],
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.x = basePosition.x;
      groupRef.current.position.z = basePosition.z;
      groupRef.current.position.y =
        basePosition.y + Math.sin(time * 1.3 + member.angle) * 0.08;

      const targetScale = hovered ? 1.2 : 1;
      const target = new THREE.Vector3(targetScale, targetScale, targetScale);
      groupRef.current.scale.lerp(target, 0.12);
    }

    if (orbRef.current) {
      orbRef.current.rotation.y += 0.01;
      orbRef.current.rotation.x += 0.005;
    }

    if (haloRef.current) {
      const pulse =
        (hovered ? 2.1 : 1.55) +
        Math.sin(time * 2 + member.angle) * (hovered ? 0.2 : 0.12);

      haloRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={basePosition}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(member);
      }}
    >
      <Float speed={1.25} rotationIntensity={0.12} floatIntensity={0.2}>
        <mesh ref={orbRef}>
          <sphereGeometry args={[0.24, 36, 36]} />
          <meshPhysicalMaterial
            color={member.color}
            emissive={member.color}
            emissiveIntensity={hovered ? 4.8 : 2.8}
            metalness={0.84}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>

        <mesh ref={haloRef}>
          <sphereGeometry args={[0.24, 26, 26]} />
          <meshBasicMaterial
            color={member.color}
            transparent
            opacity={hovered ? 0.16 : 0.08}
            side={THREE.BackSide}
          />
        </mesh>
      </Float>

      <Billboard position={[0, -0.65, 0]}>
        <group>
          <mesh position={[0, 0, -0.03]}>
            <planeGeometry args={[hovered ? 1.9 : 1.65, hovered ? 0.68 : 0.6]} />
            <meshBasicMaterial
              color="#02030a"
              transparent
              opacity={hovered ? 0.94 : 0.8}
            />
          </mesh>

          <Text
            position={[0, 0.1, 0]}
            fontSize={hovered ? 0.25 : 0.22}
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
            fontSize={hovered ? 0.12 : 0.11}
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

export default function Members({
  onSelect,
}: {
  onSelect: (member: FamilyMember) => void;
}) {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.016;
    }
  });

  return (
    <group ref={orbitRef}>
      <mesh rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[4.3, 0.009, 8, 320]} />
        <meshBasicMaterial color="#c99b38" transparent opacity={0.25} />
      </mesh>

      {familyMembers.map((member) => (
        <MemberOrb key={member.id} member={member} onSelect={onSelect} />
      ))}
    </group>
  );
}
