import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import QuizClient from "@/components/QuizClient";

export default async function KuisPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <QuizClient />;
}
