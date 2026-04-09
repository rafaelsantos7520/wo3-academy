import Link from "next/link";

type LogoMarkProps = {
  size?: number;
  href?: string;
};

export function LogoMark({ size = 42, href = "/" }: LogoMarkProps) {
  return (
    <Link
      aria-label="Ir para início"
      className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 p-1 backdrop-blur"
      href={href}
      style={{ width: size, height: size }}
    >
      <span className="text-sm font-bold uppercase tracking-wider text-white">VP</span>
    </Link>
  );
}
