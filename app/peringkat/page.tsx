import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";

function formatDurasi(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Row({
  row,
  highlight,
  divider,
}: {
  row: LeaderboardRow;
  highlight: boolean;
  divider?: boolean;
}) {
  return (
    <tr
      className={[
        highlight ? "bg-blue-50 font-semibold text-blue-900" : "",
        divider ? "sticky bottom-0 border-t-2 border-blue-300 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]" : "",
      ].join(" ")}
    >
      <td className="px-3 py-2 text-center">{row.rank}</td>
      <td className="px-3 py-2">{row.nama}</td>
      <td className="px-3 py-2 text-gray-500">{row.departemen}</td>
      <td className="px-3 py-2 text-center">{row.skor}</td>
      <td className="px-3 py-2 text-center">{formatDurasi(row.durasiDetik)}</td>
    </tr>
  );
}

export default async function PeringkatPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { top, own, ownInTop } = await getLeaderboard(session.nrp, session.nama, session.departemen);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Peringkat</h1>
      <div className="w-full max-w-2xl overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">Departemen</th>
              <th className="px-3 py-2 text-center">Skor</th>
              <th className="px-3 py-2 text-center">Durasi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {top.map((row) => (
              <Row key={row.nrp} row={row} highlight={row.nrp === session.nrp} />
            ))}
            {!ownInTop && own && <Row row={own} highlight divider />}
          </tbody>
        </table>
        {top.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-400">Belum ada peserta yang menyelesaikan kuis.</p>
        )}
      </div>
    </main>
  );
}
