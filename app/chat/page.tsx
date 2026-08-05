import { redirect } from "next/navigation";

export default function LegacyChatRedirect() {
  redirect("/v9/chat");
}
