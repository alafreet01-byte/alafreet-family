"use client";

import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";

import Camera from "./camera";
import Effects from "./effects";
import Ground from "./ground";
import Lighting from "./lighting";
import Members from "./members";
import Sky from "./sky";
import Tree from "./tree";

export default function FamilyWorld() {
  const router = useRouter();

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#05060d",
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 8.5, 17], fov: 45 }}
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Lighting />
        <Effects />
        <Sky />
        <Ground />
        <Tree />

        <Members
          onSelect={(member) => {
            router.push(`/v9/family/${member.id}`);
          }}
        />

        <Camera />
      </Canvas>

      <div
        dir="rtl"
        style={{
          position: "fixed",
          top: 22,
          right: 24,
          zIndex: 20,
          pointerEvents: "none",
          color: "white",
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "rgba(255,215,109,0.55)",
          }}
        >
          PRIVATE FAMILY UNIVERSE
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "#ffe2a0",
          }}
        >
          ALAFREET.AE
        </div>
      </div>

      <div
        dir="rtl"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%)",
          zIndex: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.38)",
          backdropFilter: "blur(14px)",
          color: "rgba(255,255,255,0.55)",
          borderRadius: 999,
          padding: "10px 18px",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        اسحب لتدوير العالم واضغط على أي فرد
      </div>
    </main>
  );
}
