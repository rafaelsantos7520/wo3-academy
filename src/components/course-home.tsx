"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stream } from "@cloudflare/stream-react";
import { CourseHeader } from "@/components/course-header";

type CourseEpisode = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  order: number;
  release_date: string | null;
};

type CourseModule = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  episodes: CourseEpisode[];
};

type CourseCategory = {
  name: string;
  slug: string;
};

type CourseContent = {
  title: string;
  description: string | null;
  release_date: string | null;
  categories: {
    primary: CourseCategory;
    related: CourseCategory[];
  };
  content_types: {
    name: string;
  };
  modules: CourseModule[];
};

type PlaybackState = {
  customerCode: string;
  streamId: string;
  thumbnailUrl: string | null;
  signed: boolean;
};

type CourseHomeProps = {
  course: CourseContent;
};

type FlatEpisode = CourseEpisode & {
  moduleId: string;
  moduleName: string;
  moduleOrder: number;
};

const GLASS =
  "border border-white/20 bg-[linear-gradient(135deg,rgba(18,18,18,0.16),rgba(24,24,24,0.10))] backdrop-blur-2xl shadow-[0_10px_36px_rgba(0,0,0,0.28)]";
const GLASS_SOFT =
  "border border-white/14 bg-[linear-gradient(135deg,rgba(18,18,18,0.12),rgba(24,24,24,0.08))] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.24)]";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function minutesLabel(duration: number | null | undefined) {
  return `${duration || 0} min`;
}

function PlayerSkeleton() {
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden bg-[linear-gradient(160deg,rgba(8,8,8,0.92),rgba(20,18,16,0.80))]">
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_45%,transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-white/35 bg-white/10 backdrop-blur-sm">
          <div className="ml-1 h-0 w-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white/90" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">Carregando aula</p>
          <p className="mt-1 text-xs text-white/60">preparando o vídeo selecionado</p>
        </div>
      </div>
    </div>
  );
}

export function CourseHome({ course }: CourseHomeProps) {
  const searchParams = useSearchParams();
  const flatEpisodes = useMemo<FlatEpisode[]>(
    () =>
      course.modules.flatMap((module) =>
        module.episodes.map((episode) => ({
          ...episode,
          moduleId: module.id,
          moduleName: module.name,
          moduleOrder: module.order,
        })),
      ),
    [course.modules],
  );

  const [isWatching, setIsWatching] = useState(searchParams.get("view") === "watch");
  const [activeModuleId, setActiveModuleId] = useState<string>(
    course.modules[0]?.id ?? "",
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(
    flatEpisodes[0]?.id ?? "",
  );
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const activeEpisode = flatEpisodes.find((episode) => episode.id === activeEpisodeId);
  const activeModule =
    course.modules.find((module) => module.id === activeModuleId) ?? course.modules[0];
  const totalVideos = flatEpisodes.length;

  function watchHref(moduleId: string, episodeId: string) {
    return `/?view=watch&m=${moduleId}&e=${episodeId}`;
  }

  function prepareEpisodeChange() {
    setPlayback(null);
    setIsPlayerReady(false);
    setPlayerError(null);
  }

  useEffect(() => {
    if (activeEpisode) {
      setActiveModuleId(activeEpisode.moduleId);
    }
  }, [activeEpisode]);

  useEffect(() => {
    const view = searchParams.get("view");
    const m = searchParams.get("m");
    const e = searchParams.get("e");
    const hasModule = !!m && course.modules.some((module) => module.id === m);
    const hasEpisode = !!e && flatEpisodes.some((episode) => episode.id === e);

    setIsWatching(view === "watch");

    if (hasModule) {
      setActiveModuleId(m!);
    }

    if (hasEpisode) {
      setActiveEpisodeId(e!);
    }
  }, [course.modules, flatEpisodes, searchParams]);

  useEffect(() => {
    if (!isWatching || !activeEpisodeId) {
      return;
    }

    const controller = new AbortController();

    async function loadPlayback() {
      try {
        setIsPlayerReady(false);
        setPlayback(null);
        setPlayerError(null);

        const response = await fetch(`/api/episodes/${activeEpisodeId}/playback`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const payload = (await response.json()) as PlaybackState & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Não foi possível carregar o playback.");
        }

        if (!controller.signal.aborted) {
          setPlayback(payload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPlayerError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o playback.",
          );
        }
      }
    }

    loadPlayback();

    return () => controller.abort();
  }, [activeEpisodeId, isWatching]);

  if (!isWatching) {
    return (
      <main className="relative min-h-screen overflow-x-hidden text-white">
        <div className="pointer-events-none fixed inset-0 -z-30 bg-[url('/produtos.jpeg')] bg-cover bg-center" />
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),rgba(15,13,11,0.20)_42%,rgba(4,4,4,0.55)_100%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,3,3,0.28)_0%,rgba(3,3,3,0.55)_68%,rgba(3,3,3,0.72)_100%)]" />

        <CourseHeader
          title={course.title}
          modulesCount={course.modules.length}
          lessonsCount={totalVideos}
          glassClassName={`${GLASS_SOFT} rounded-2xl`}
        />

        <section className="mx-auto mt-10 w-full max-w-[1600px] px-6 lg:px-10">
          <article className={`${GLASS} rounded-[30px] p-6 md:p-8`}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">
              Ozonect Academy
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
              Plataforma WO3 Pro Web
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/82 md:text-base">
              {course.description ||
                "Treinamento oficial da linha WO3 com base científica, protocolos práticos e narrativa comercial para uso profissional."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span>{formatDate(course.release_date)}</span>
              <span className="h-1 w-1 rounded-full bg-white/45" />
              <span>{course.categories.primary.name}</span>
              <span className="h-1 w-1 rounded-full bg-white/45" />
              <span>{course.modules.length} módulos</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={watchHref(
                  course.modules[0]?.id ?? "",
                  course.modules[0]?.episodes[0]?.id ?? "",
                )}
                onClick={prepareEpisodeChange}
                scroll={false}
                className="rounded-full bg-[#f5e8d5] px-6 py-3  font-semibold  transition hover:bg-[#f0dec3]"
              >
                <span className="text-sm uppercase tracking-widest text-black/90">
                  Começar a assistir
                </span>
              </Link>
              <Link
                href="#base-tecnologica"
                className="rounded-full border border-white/30 bg-black/18 px-6 py-3 text-sm font-medium text-white/90 transition hover:bg-black/32"
              >
                Especificações técnicas
              </Link>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Ozônio
                </p>
                <p className="mt-2 text-sm text-white/90">Sistema de terapia capilar cosmética</p>
              </div>
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Tecnologia
                </p>
                <p className="mt-2 text-sm text-white/90">Carreamento servo assistido e equalização iônica</p>
              </div>
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Resultado
                </p>
                <p className="mt-2 text-sm text-white/90">Brilho evidente e acabamento de veludo</p>
              </div>
            </div>
          </article>

        </section>

        <section className="mx-auto mt-6 w-full max-w-[1600px] px-6 lg:px-10">
          <div className={`${GLASS_SOFT} overflow-hidden rounded-[22px]`}>
            <Image
              alt="Linha WO3 Ozonizada"
              className="h-auto w-full object-contain"
              height={627}
              priority
              sizes="(max-width: 1320px) 100vw, 1600px"
              src="/banner.webp"
              width={1600}
            />
          </div>
        </section>

        <section className="mx-auto my-8 w-full max-w-[1600px] px-6 lg:px-10">
          <div id="base-tecnologica" className={`${GLASS} rounded-[30px] p-5 md:p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Base tecnológica WO3</h3>
              <span className="text-sm text-white/70">{course.modules.length} módulos</span>
            </div>

            <div className="mb-5 grid gap-3 lg:grid-cols-3">
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Tripé tecnológico
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Ozônio, carreamento servo assistido e equalização iônica.
                </p>
              </div>
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Sistema profissional
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Terapia capilar cosmética para resultados visíveis e protocolos consistentes.
                </p>
              </div>
              <div className={`${GLASS_SOFT} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">
                  Papel do profissional
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Diagnosticar, ajustar água e lipídios, reconstruir com inteligência e finalizar com toque seco.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                Trilha de treinamento
              </p>
            </div>

            <div className="space-y-3">
              {course.modules.map((module) => (
                <Link
                  key={module.id}
                  href={watchHref(module.id, module.episodes[0]?.id ?? "")}
                  onClick={prepareEpisodeChange}
                  scroll={false}
                  className={`${GLASS_SOFT} group flex w-full cursor-pointer items-center justify-between rounded-[18px] px-4 py-4 text-left transition hover:bg-black/16`}
                >
                  <div className="flex items-center gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/30 text-sm text-white/85">
                      {String(module.order).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="text-xl font-semibold leading-tight text-white">
                        {module.name}
                      </h4>
                      <p className="mt-1 text-sm text-white/70">{module.episodes.length} aulas</p>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/85">
                    Iniciar
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[url('/produtos.jpeg')] bg-cover bg-center" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(234,214,186,0.24),rgba(12,10,9,0.28)_42%,rgba(4,4,4,0.62)_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,3,3,0.24)_0%,rgba(3,3,3,0.48)_66%,rgba(3,3,3,0.76)_100%)]" />

      <CourseHeader
        title={course.title}
        modulesCount={course.modules.length}
        lessonsCount={totalVideos}
        showBackLink
        backHref="/"
        brandLabel="Ozonteck"
        glassClassName={`${GLASS_SOFT} rounded-2xl`}
      />

      <section className="mx-auto my-6 grid w-full max-w-[1600px] gap-6 px-6 lg:grid-cols-[250px_minmax(0,1fr)_350px] lg:px-10">
        <aside className={`${GLASS} rounded-3xl p-4`}>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">Trilhas</p>
          <div className="mt-3 space-y-2">
            {course.modules.map((module) => {
              const selected = module.id === activeModule?.id;

              return (
                <Link
                  key={module.id}
                  href={watchHref(module.id, module.episodes[0]?.id ?? "")}
                  onClick={prepareEpisodeChange}
                  scroll={false}
                  className={`block w-full cursor-pointer rounded-2xl px-3 py-3 text-left transition ${selected
                    ? "border border-white/38 bg-black/26 backdrop-blur-xl"
                    : "border border-white/16 bg-black/14 backdrop-blur-xl hover:bg-black/26"
                    }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                    Trilha {module.order}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-tight">{module.name}</h3>
                  <p className="mt-1 text-xs text-white/68">{module.episodes.length} aulas</p>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          <div className={`${GLASS} overflow-hidden rounded-3xl`}>
            <div className="relative">
              {playback ? (
                <>
                  <div className={isPlayerReady ? "block" : "invisible"}>
                    <Stream
                      key={`${activeEpisodeId}-${playback.streamId}`}
                      controls
                      customerCode={playback.customerCode}
                      onCanPlay={() => setIsPlayerReady(true)}
                      onLoadedData={() => setIsPlayerReady(true)}
                      poster={playback.thumbnailUrl ?? undefined}
                      primaryColor="#f5f5f5"
                      responsive
                      src={playback.streamId}
                    />
                  </div>
                  {!isPlayerReady ? <PlayerSkeleton /> : null}
                </>
              ) : (
                <PlayerSkeleton />
              )}
            </div>
          </div>

          <div className={`${GLASS} rounded-[20px] p-4`}>
            {playerError ? (
              <p className="text-sm text-rose-300">{playerError}</p>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/65">
                  Em reprodução
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">
                  {activeEpisode?.name}
                </h3>
                <p className="mt-2 text-sm text-white/78">
                  {activeEpisode?.moduleName} - {minutesLabel(activeEpisode?.duration)}
                </p>
              </>
            )}
          </div>
        </section>

        <aside className={`${GLASS} rounded-3xl p-4`}>
          <div className="border-b border-white/16 pb-3">
            <h3 className="text-lg font-semibold">{activeModule?.name}</h3>
            <p className="mt-1 text-xs text-white/68">
              {activeModule?.episodes.length || 0} aulas nesta trilha
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {activeModule?.episodes.map((episode) => {
              const selected = episode.id === activeEpisodeId;

              return (
                <Link
                  key={episode.id}
                  href={watchHref(activeModule.id, episode.id)}
                  onClick={prepareEpisodeChange}
                  scroll={false}
                  className={`block w-full cursor-pointer rounded-2xl p-3 text-left transition ${selected
                    ? "border border-white/38 bg-black/26 backdrop-blur-xl"
                    : "border border-white/16 bg-black/14 backdrop-blur-xl hover:bg-black/26"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                        Aula {episode.order}
                      </p>
                      <h4 className="mt-1 line-clamp-2 text-base font-semibold leading-tight">
                        {episode.name}
                      </h4>
                      <p className="mt-1 text-xs text-white/68">
                        {minutesLabel(episode.duration)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white/85">
                        {episode.order}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
