import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

type CourseHeaderProps = {
  title: string;
  modulesCount: number;
  lessonsCount: number;
  showBackLink?: boolean;
  backHref?: string;
  brandLabel?: string;
  glassClassName: string;
};

export function CourseHeader({
  title,
  modulesCount,
  lessonsCount,
  showBackLink = false,
  backHref = "/",
  brandLabel = "Vídeo Prime",
  glassClassName,
}: CourseHeaderProps) {
  return (
    <header className={`${glassClassName} sticky top-0 z-20 mt-4`}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/55">
              {brandLabel}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showBackLink ? (
            <Link
              href={backHref}
              className="rounded-full border border-white/32 bg-black/20 px-4 py-2 text-sm text-white/90 transition hover:bg-black/35"
            >
              Voltar para apresentação
            </Link>
          ) : null}

          <div className="hidden gap-3 text-sm text-white/75 md:flex">
            <span className="rounded-full border border-white/28 bg-black/20 px-4 py-2">
              {modulesCount} módulos
            </span>
            <span className="rounded-full border border-white/28 bg-black/20 px-4 py-2">
              {lessonsCount} aulas
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
