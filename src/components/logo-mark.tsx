import Link from "next/link";
import Image from "next/image";

type LogoMarkProps = {
  size?: number;
  href?: string;
};

export function LogoMark({ size = 50, href = "/" }: LogoMarkProps) {
  return (
    <Link
      aria-label="Ir para início"
      className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 p-1 backdrop-blur"
      href={href}
      style={{ width: size, height: size }}
    >
      <Image src="/logo.webp" alt="Logo" width={size} height={size} />
    </Link>
  );
}
