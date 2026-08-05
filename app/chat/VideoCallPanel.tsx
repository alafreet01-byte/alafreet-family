"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const filters = [
  ["طبيعي", "none"],
  ["ناعم", "brightness(1.08) saturate(.9)"],
  ["دافئ", "sepia(.22) saturate(1.25)"],
  ["أبيض وأسود", "grayscale(1)"],
] as const;

export default function VideoCallPanel({ supabase, roomId, name, onClose }: { supabase: SupabaseClient; roomId: string; name: string; onClose: () => void }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [filter, setFilter] = useState("none");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [status, setStatus] = useState("جاري تشغيل الكاميرا…");

  useEffect(() => {
    const channel = supabase.channel(`family-call:${roomId}`);
    let closed = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (closed) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        peer.ontrack = (event) => { if (remoteRef.current) remoteRef.current.srcObject = event.streams[0]; setStatus("المكالمة متصلة"); };
        peer.onicecandidate = (event) => { if (event.candidate) void channel.send({ type: "broadcast", event: "candidate", payload: event.candidate.toJSON() }); };
        channel
          .on("broadcast", { event: "ready" }, async () => {
            const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
            await channel.send({ type: "broadcast", event: "offer", payload: offer });
          })
          .on("broadcast", { event: "offer" }, async ({ payload }) => {
            if (peer.signalingState !== "stable") return;
            await peer.setRemoteDescription(payload); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
            await channel.send({ type: "broadcast", event: "answer", payload: answer });
          })
          .on("broadcast", { event: "answer" }, async ({ payload }) => { if (!peer.currentRemoteDescription) await peer.setRemoteDescription(payload); })
          .on("broadcast", { event: "candidate" }, async ({ payload }) => { try { await peer.addIceCandidate(payload); } catch {} })
          .subscribe(async (state) => { if (state === "SUBSCRIBED") { setStatus("بانتظار انضمام الطرف الآخر…"); await channel.send({ type: "broadcast", event: "ready", payload: { name } }); } });
      } catch { setStatus("اسمح للموقع باستخدام الكاميرا والميكروفون."); }
    }
    void start();
    return () => { closed = true; streamRef.current?.getTracks().forEach((track) => track.stop()); peerRef.current?.close(); void supabase.removeChannel(channel); };
  }, [name, roomId, supabase]);

  return <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><div className="w-full max-w-5xl rounded-[30px] border border-white/10 bg-[#080b16] p-5 text-white"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">مكالمة فيديو عائلية</h2><p className="mt-1 text-sm text-emerald-300">{status}</p></div><button onClick={onClose} className="rounded-xl bg-rose-500/15 px-4 py-2 text-rose-200">إنهاء المكالمة</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><video ref={remoteRef} autoPlay playsInline className="aspect-video w-full rounded-3xl bg-black object-cover"/><video ref={localRef} autoPlay muted playsInline style={{filter}} className="aspect-video w-full scale-x-[-1] rounded-3xl bg-black object-cover"/></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>{const next=!muted;setMuted(next);streamRef.current?.getAudioTracks().forEach(t=>t.enabled=!next)}} className="rounded-xl bg-white/10 px-4 py-3">{muted?"تشغيل الصوت":"كتم الصوت"}</button><button onClick={()=>{const next=!cameraOff;setCameraOff(next);streamRef.current?.getVideoTracks().forEach(t=>t.enabled=!next)}} className="rounded-xl bg-white/10 px-4 py-3">{cameraOff?"تشغيل الكاميرا":"إيقاف الكاميرا"}</button>{filters.map(([label,value])=><button key={label} onClick={()=>setFilter(value)} className={`rounded-xl px-4 py-3 ${filter===value?"bg-cyan-400 text-black":"bg-white/10"}`}>{label}</button>)}</div></div></div>;
}
