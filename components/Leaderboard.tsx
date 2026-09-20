import type { LeaderboardRow } from "@/lib/leaderboard";

function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDurasi(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PODIUM_STYLE: Record<
  number,
  { order: string; height: string; ring: string; badge: string; crown: string }
> = {
  1: { order: "order-2", height: "h-32", ring: "ring-amber-300", badge: "bg-amber-400 text-amber-950", crown: "👑" },
  2: { order: "order-1", height: "h-24", ring: "ring-slate-300", badge: "bg-slate-300 text-slate-900", crown: "" },
  3: { order: "order-3", height: "h-16", ring: "ring-amber-700", badge: "bg-amber-700 text-amber-50", crown: "" },
};

export default function Leaderboard({
  top,
  own,
  ownInTop,
  total,
  currentNrp,
}: {
  top: LeaderboardRow[];
  own: LeaderboardRow | null;
  ownInTop: boolean;
  total: number;
  currentNrp: string;
}) {
  const podium = top.slice(0, 3);
  const rest = top.slice(3);
  const ownRank = ownInTop ? top.find((r) => r.nrp === currentNrp)?.rank : own?.rank;

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
      <h2 className="text-center text-xl font-bold uppercase tracking-wide text-amber-300 sm:text-2xl">
        Peringkat
      </h2>

      {top.length === 0 ? (
        <p className="py-6 text-center text-base text-slate-300">Belum ada peserta yang menyelesaikan kuis.</p>
      ) : (
        <>
          <div className="flex items-end justify-center gap-2 sm:gap-4">
            {podium.map((row) => {
              const style = PODIUM_STYLE[row.rank];
              const isMe = row.nrp === currentNrp;
              return (
                <div key={row.nrp} className={`flex flex-col items-center gap-1.5 ${style.order}`}>
                  <span className="h-6 text-xl leading-none sm:h-7 sm:text-2xl">{style.crown}</span>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-base font-bold text-white ring-4 sm:h-16 sm:w-16 sm:text-lg ${style.ring} ${
                      isMe ? "outline outline-2 outline-offset-2 outline-white" : ""
                    }`}
                  >
                    {initials(row.nama)}
                  </div>
                  <div
                    className={`flex w-16 flex-col items-center justify-start rounded-t-lg sm:w-24 ${style.height} ${style.badge} pt-1.5`}
                  >
                    <span className="text-xs font-bold sm:text-sm">#{row.rank}</span>
                  </div>
                  <p className="max-w-[4.5rem] truncate text-center text-xs font-medium text-white sm:max-w-[7rem] sm:text-sm">
                    {row.nama}
                  </p>
                  <p className="max-w-[4.5rem] truncate text-center text-[10px] text-slate-400 sm:max-w-[7rem] sm:text-xs">
                    {row.departemen} · {row.nrp}
                  </p>
                  <p className="text-xs font-semibold text-slate-300 sm:text-sm">{row.skor}</p>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {rest.map((row) => (
                <LeaderboardListRow key={row.nrp} row={row} highlight={row.nrp === currentNrp} />
              ))}
            </ul>
          )}

          {!ownInTop && own && (
            <ul className="overflow-hidden rounded-xl border border-amber-400/40">
              <LeaderboardListRow row={own} highlight />
            </ul>
          )}
        </>
      )}

      {ownRank !== undefined && (
        <p className="text-center text-base text-slate-200">
          Peringkat kamu <span className="font-bold text-white">#{ownRank}</span> dari {total} peserta
        </p>
      )}
    </div>
  );
}

function LeaderboardListRow({ row, highlight }: { row: LeaderboardRow; highlight: boolean }) {
  return (
    <li
      className={`flex items-center gap-2 px-3 py-3 text-sm sm:gap-4 sm:px-4 sm:text-base ${
        highlight ? "bg-amber-400/20 font-semibold text-amber-200" : "text-slate-100"
      }`}
    >
      <span className="min-w-[1.75rem] shrink-0 text-center text-xs text-slate-400 sm:min-w-[2.25rem] sm:text-sm">
        {row.rank}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm">
        {initials(row.nama)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{row.nama}</span>
        <span className="block truncate text-xs text-slate-400">
          {row.departemen} · {row.nrp}
        </span>
      </span>
      <span className="shrink-0 text-xs text-slate-400 sm:text-sm">{formatDurasi(row.durasiDetik)}</span>
      <span className="min-w-[2.5rem] shrink-0 text-right font-bold sm:min-w-[3rem]">{row.skor}</span>
    </li>
  );
}
