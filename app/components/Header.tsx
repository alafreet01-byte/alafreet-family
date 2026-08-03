import type { ReactNode } from "react";
export default function Header({ title, subtitle, rightContent }: { title:string; subtitle?:string; rightContent?:ReactNode }) {
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b18]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
      <div><h1 className="text-2xl font-black">{title}</h1>{subtitle && <p className="mt-1 text-sm text-cyan-300">{subtitle}</p>}</div>
      <div className="flex items-center gap-3">{rightContent}<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 text-xl font-black">A</div></div>
    </div>
  </header>;
}
