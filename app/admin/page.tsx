import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminOverview } from "@/lib/admin";
import AdminTable from "@/components/AdminTable";
import PageBackground from "@/components/PageBackground";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (!session.isAdmin) redirect("/mulai");

  const rows = await getAdminOverview();

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-900 px-4 py-10 sm:px-8">
      <PageBackground />
      <LogoutButton />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">Admin · Rekap Peserta</h1>
        <AdminTable rows={rows} />
      </div>
    </main>
  );
}
