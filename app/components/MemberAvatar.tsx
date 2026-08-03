import Image from "next/image";
import type { FamilyMember } from "../types";
export default function MemberAvatar({member,size="lg"}:{member:FamilyMember;size?:"sm"|"lg"}){
  const c=size==="lg"?"h-24 w-24 text-4xl":"h-12 w-12 text-xl";
  return <div className={`${c} relative overflow-hidden rounded-full bg-gradient-to-br ${member.gradient} p-1`} style={{boxShadow:`0 0 30px ${member.glow}`}}>
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-950">
      {member.image?<Image src={member.image} alt={member.name} width={size==="lg"?96:48} height={size==="lg"?96:48} className="h-full w-full object-cover"/>:<span>{member.icon}</span>}
    </div>
  </div>;
}
