import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
export default function AppShell({title,subtitle,children}:{title:string;subtitle?:string;children:ReactNode}){
  return <main className="min-h-screen bg-[#030712] text-white">
    <Header title={title} subtitle={subtitle}/>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 lg:flex-row"><Sidebar/><section className="min-w-0 flex-1">{children}</section></div>
  </main>;
}
