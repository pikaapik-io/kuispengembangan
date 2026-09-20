import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/mulai");

  const { data } = await db.from("peserta").select("departemen");
  const departemenList = Array.from(new Set((data ?? []).map((d) => d.departemen))).sort();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Kuis Temu FTEIC</h1>
        <p className="mt-1 text-sm text-gray-500">Masuk dengan data pendaftaranmu untuk mulai.</p>
      </div>
      <LoginForm departemenList={departemenList} />
    </main>
  );
}
