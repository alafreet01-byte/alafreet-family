"use client";

import { useRouter } from "next/navigation";

import { familyMembers } from "./data";

const positions = [
  { left: "50%", top: "17%" },
  { left: "27%", top: "26%" },
  { left: "73%", top: "26%" },
  { left: "13%", top: "43%" },
  { left: "38%", top: "43%" },
  { left: "62%", top: "43%" },
  { left: "87%", top: "43%" },
  { left: "35%", top: "64%" },
  { left: "65%", top: "64%" },
];

export default function FamilyTreePage() {
  const router = useRouter();

  return (
    <main className="family-tree" dir="rtl">
      <div className="shade" />

      <header>
        <p>ALAFREET FAMILY TREE</p>
        <h1>شجرة عائلة العفريت</h1>
        <span>اضغط على صورة أي فرد لفتح عالمه الخاص</span>
      </header>

      <button className="back" onClick={() => router.push("/v9/home")}>
        البيت الرقمي ←
      </button>

      <section className="members" aria-label="أفراد العائلة">
        {familyMembers.map((member, index) => (
          <button
            key={member.id}
            className="member"
            style={{
              left: positions[index].left,
              top: positions[index].top,
              "--member-color": member.color,
            } as React.CSSProperties}
            onClick={() => router.push(`/v9/family/${member.id}`)}
          >
            <span className="portrait">{member.name.slice(0, 1)}</span>
            <strong>{member.name}</strong>
            <small>{member.role}</small>
          </button>
        ))}
      </section>

      <style jsx>{`
        .family-tree {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          overflow: hidden;
          background: #020711 url('/v9/family-ghaf-tree.png') center / cover no-repeat;
          color: white;
          font-family: inherit;
        }
        .shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(1, 6, 15, .3), transparent 55%, rgba(1, 3, 8, .58));
          pointer-events: none;
        }
        header {
          position: absolute;
          z-index: 3;
          top: 24px;
          right: 28px;
          text-align: right;
          text-shadow: 0 2px 12px #000;
        }
        header p { margin: 0; color: #d8ae52; font: 700 10px/1.4 sans-serif; letter-spacing: .28em; }
        header h1 { margin: 5px 0; color: #ffe8ad; font-size: clamp(22px, 2.3vw, 36px); }
        header span { color: rgba(255,255,255,.68); font-size: 12px; }
        .back {
          position: absolute;
          z-index: 4;
          top: 26px;
          left: 28px;
          padding: 11px 17px;
          border: 1px solid rgba(255, 214, 112, .35);
          border-radius: 14px;
          background: rgba(2, 7, 17, .68);
          color: #ffe4a1;
          cursor: pointer;
          backdrop-filter: blur(12px);
        }
        .members { position: absolute; inset: 0; z-index: 2; }
        .member {
          --member-color: #ffd76d;
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex;
          width: 112px;
          flex-direction: column;
          align-items: center;
          border: 0;
          background: transparent;
          color: white;
          cursor: pointer;
          filter: drop-shadow(0 4px 13px rgba(0,0,0,.95));
          transition: transform .22s ease;
        }
        .member:hover, .member:focus-visible { transform: translate(-50%, -50%) scale(1.12); outline: none; }
        .portrait {
          display: grid;
          width: clamp(54px, 5.2vw, 76px);
          aspect-ratio: 1;
          place-items: center;
          border: 3px solid #f3c65d;
          border-radius: 50%;
          background: radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--member-color) 82%, white), #111a23 72%);
          box-shadow: 0 0 0 5px rgba(4,9,16,.76), 0 0 24px color-mix(in srgb, var(--member-color) 58%, transparent);
          color: #fff8dc;
          font-size: clamp(21px, 2.2vw, 31px);
          font-weight: 900;
        }
        strong {
          margin-top: 9px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(1,5,12,.78);
          color: #fff3cc;
          font-size: 14px;
          white-space: nowrap;
        }
        small { margin-top: 2px; color: var(--member-color); text-shadow: 0 1px 5px #000; }
        @media (max-width: 720px) {
          .family-tree { min-height: 760px; background-position: center bottom; }
          header { right: 16px; top: 18px; }
          header span { display: none; }
          .back { left: 14px; top: 18px; padding: 9px 12px; }
          .member { width: 78px; }
          strong { font-size: 11px; margin-top: 6px; }
          small { font-size: 9px; }
        }
      `}</style>
    </main>
  );
}
