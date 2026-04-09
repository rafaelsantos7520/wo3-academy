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
  brandLabel = "Ozon Academy",
  glassClassName,
}: CourseHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={`${glassClassName} mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.32em] text-white/55">
              {brandLabel}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showBackLink ? (
            <Link
              href={backHref}
              className="rounded-full border border-white/32 bg-black/20 px-3 py-2 text-xs text-white/90 transition hover:bg-black/35 sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Voltar</span>
              <span className="hidden sm:inline">Voltar para apresentação</span>
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
