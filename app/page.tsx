import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import PageBackground from "@/components/PageBackground";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.isAdmin ? "/admin" : "/mulai");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-slate-900 px-4 py-12">
      <PageBackground />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-14">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Login</h1>
          <p className="mt-2 text-base text-slate-200/80 sm:text-lg">Kuis How To Win Friends</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
