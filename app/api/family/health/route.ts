import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id, name_ar, role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}
const isParent=(role:string)=>role==="super_admin"||role==="school_admin";
const healthTypes=["health.appointment","health.medication","health.record"];

export async function GET(){
 const auth=await requireMember();if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const [{data:members},{data:events,error}]=await Promise.all([auth.admin.from("family_members").select("id, name_ar, role").order("name_ar"),auth.admin.from("core_events").select("id, event_type, title, details, actor_id, metadata, created_at").in("event_type",healthTypes).order("created_at",{ascending:false})]);
 if(error)return NextResponse.json({error:error.message},{status:400});const canManage=isParent(auth.member.role);
 const visible=(events??[]).filter(e=>canManage||e.metadata?.memberId===auth.member.id);
 return NextResponse.json({viewer:auth.member,canManage,members:members??[],appointments:visible.filter(e=>e.event_type==="health.appointment").map(e=>({id:e.id,title:e.title,note:e.details??"",...e.metadata})),medications:visible.filter(e=>e.event_type==="health.medication").map(e=>({id:e.id,title:e.title,note:e.details??"",...e.metadata})),records:visible.filter(e=>e.event_type==="health.record").map(e=>({id:e.id,title:e.title,note:e.details??"",...e.metadata}))});
}

export async function POST(request:Request){
 const auth=await requireMember();if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});const body=await request.json();const kind=String(body.kind??"");if(!["appointment","medication","record"].includes(kind))return NextResponse.json({error:"نوع السجل غير معروف."},{status:400});
 let memberId=String(body.memberId??auth.member.id);if(!isParent(auth.member.role))memberId=auth.member.id;const {data:member}=await auth.admin.from("family_members").select("id, name_ar").eq("id",memberId).maybeSingle();if(!member)return NextResponse.json({error:"فرد العائلة غير موجود."},{status:404});
 const title=String(body.title??"").trim();if(!title)return NextResponse.json({error:"الاسم مطلوب."},{status:400});let metadata:Record<string,unknown>={memberId,memberName:member.name_ar};
 if(kind==="appointment"){const startsAt=String(body.startsAt??"");if(!startsAt||Number.isNaN(new Date(startsAt).getTime()))return NextResponse.json({error:"تاريخ الموعد ووقته مطلوبان."},{status:400});metadata={...metadata,startsAt,hospital:String(body.hospital??""),doctor:String(body.doctor??""),department:String(body.department??""),status:"upcoming"};}
 if(kind==="medication"){metadata={...metadata,dose:String(body.dose??""),schedule:String(body.schedule??""),refillAt:String(body.refillAt??""),remaining:Number(body.remaining??0),status:"active"};}
 if(kind==="record"){metadata={...metadata,recordType:String(body.recordType??"تحليل"),recordDate:String(body.recordDate??""),result:String(body.result??"")};}
 const {error}=await auth.admin.from("core_events").insert({event_type:`health.${kind}`,title,details:String(body.note??"").trim(),actor_id:auth.member.id,metadata});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){const auth=await requireMember();if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});const {id}=await request.json();const {data:event}=await auth.admin.from("core_events").select("id, actor_id, metadata").eq("id",String(id??"")).in("event_type",healthTypes).maybeSingle();if(!event)return NextResponse.json({error:"السجل غير موجود."},{status:404});if(!isParent(auth.member.role)&&event.metadata?.memberId!==auth.member.id)return NextResponse.json({error:"لا تملك صلاحية الحذف."},{status:403});const {error}=await auth.admin.from("core_events").delete().eq("id",event.id);if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});}
