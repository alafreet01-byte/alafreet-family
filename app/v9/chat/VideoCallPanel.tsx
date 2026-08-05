"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function VideoCallPanel({ conversationId, targetId, targetName }: { conversationId: string; targetId: string; targetName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("جاهز للمكالمة");
  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<HTMLVideoElement>(null);
  const remote = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const processed = useRef(new Set<string>());
  const startedAt = useRef(new Date(Date.now() - 3000).toISOString());

  const signal = useCallback(async (type: string, payload: unknown = null) => {
    await fetch("/api/family/chat/call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, targetId, type, payload }) });
  }, [conversationId, targetId]);

  const prepare = useCallback(async () => {
    if (pc.current) return pc.current;
    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.current = media;
    if (local.current) local.current.srcObject = media;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] });
    media.getTracks().forEach((track) => peer.addTrack(track, media));
    peer.ontrack = (event) => { if (remote.current) remote.current.srcObject = event.streams[0]; setStatus("متصل الآن"); };
    peer.onicecandidate = (event) => { if (event.candidate) void signal("candidate", event.candidate.toJSON()); };
    peer.onconnectionstatechange = () => { if (peer.connectionState === "connected") setStatus("متصل الآن"); if (["failed", "disconnected"].includes(peer.connectionState)) setStatus("انقطع الاتصال"); };
    pc.current = peer;
    return peer;
  }, [signal]);

  const hangup = useCallback(async (notify = true) => {
    if (notify) await signal("hangup");
    pc.current?.close(); pc.current = null;
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
    setOpen(false); setStatus("جاهز للمكالمة");
  }, [signal]);

  async function call() {
    try {
      setOpen(true); setStatus(`جاري الاتصال بـ ${targetName}…`); startedAt.current = new Date().toISOString();
      const peer = await prepare();
      const offer = await peer.createOffer(); await peer.setLocalDescription(offer); await signal("offer", offer);
    } catch { setStatus("تعذر تشغيل الكاميرا أو الميكروفون"); }
  }

  useEffect(() => {
    if (!conversationId || !targetId) return;
    const poll = async () => {
      try {
        const response = await fetch(`/api/family/chat/call?conversation=${encodeURIComponent(conversationId)}&since=${encodeURIComponent(startedAt.current)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        for (const item of data.signals ?? []) {
          if (processed.current.has(item.id)) continue;
          processed.current.add(item.id);
          if (item.type === "offer") {
            const accept = window.confirm(`${item.senderName} يتصل بك بالفيديو. هل تريد الرد؟`);
            if (!accept) { await signal("decline"); continue; }
            setOpen(true); setStatus(`مكالمة مع ${item.senderName}`); const peer = await prepare(); await peer.setRemoteDescription(item.payload); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await signal("answer", answer);
          } else if (item.type === "answer" && pc.current) await pc.current.setRemoteDescription(item.payload);
          else if (item.type === "candidate" && pc.current) { try { await pc.current.addIceCandidate(item.payload); } catch { /* يصل بعض المرشحين مبكرًا */ } }
          else if (item.type === "hangup" || item.type === "decline") { setStatus(item.type === "decline" ? "لم يتم الرد" : "انتهت المكالمة"); window.setTimeout(() => void hangup(false), 1200); }
        }
      } catch { /* يستمر الفحص عند عودة الشبكة */ }
    };
    void poll(); const timer = window.setInterval(() => void poll(), 1800); return () => window.clearInterval(timer);
  }, [conversationId, targetId, prepare, signal, hangup]);

  return <><button onClick={() => void call()} title="مكالمة فيديو" className="mr-auto rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">📹 فيديو</button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"><div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#07100d]"><video ref={remote} autoPlay playsInline className="aspect-video w-full bg-black object-cover" /><video ref={local} autoPlay muted playsInline className="absolute bottom-24 left-4 aspect-[3/4] w-28 rounded-2xl border-2 border-white/30 bg-black object-cover sm:w-40" /><div className="flex items-center justify-between gap-4 p-5"><div><strong>مكالمة فيديو مع {targetName}</strong><p className="mt-1 text-xs text-white/45">{status}</p></div><button onClick={() => void hangup()} className="rounded-full bg-red-500 px-6 py-3 font-black">إنهاء ☎</button></div></div></div>}</>;
}
