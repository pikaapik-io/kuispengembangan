import Image from "next/image";

export default function PageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0">
      <Image src="/background.jpg" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/45 to-slate-950/75" />
    </div>
  );
}
