import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (member?.role === "super_admin") redirect("/v9/father");
  if (member?.id === "amal" || member?.role === "school_admin") redirect("/v9/amal");
  if (member?.role === "university_user") redirect("/v9/khalid");
  if (member?.role === "student" || member?.role === "child") redirect("/v9/school");

  redirect("/v9/home");
}
