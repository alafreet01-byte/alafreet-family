"use client";

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[7, 10, 6]} intensity={2.2} color="#fff4d0" castShadow />
      <pointLight position={[0, 4, 3]} intensity={20} color="#ffbf45" distance={20} decay={2} />
      <pointLight position={[-5, 1, -3]} intensity={8} color="#506dff" distance={17} decay={2} />
      <pointLight position={[5, -1, 2]} intensity={5} color="#ff8a35" distance={14} decay={2} />
    </>
  );
}
