import { Suspense } from "react";
import { CourseHome } from "@/components/course-home";
import { COURSE_SLUG, getCourseContent } from "@/lib/course-content";

function serializeCourse(content: NonNullable<Awaited<ReturnType<typeof getCourseContent>>>) {
  return {
    id: content.id.toString(),
    title: content.title,
    slug: content.slug,
    description: content.description,
    release_date: content.release_date?.toISOString() ?? null,
    categories: {
      primary: content.categories,
      related: content.content_categories.map(({ categories }) => categories),
    },
    content_types: content.content_types,
    modules: content.modules.map((module) => ({
      id: module.id.toString(),
      uuid: module.uuid,
      name: module.name,
      slug: module.slug,
      role: module.role,
      description: module.description,
      order: module.order,
      is_active: module.is_active,
      created_at: module.created_at?.toISOString() ?? null,
      updated_at: module.updated_at?.toISOString() ?? null,
      episodes: module.episodes.map((episode) => ({
        id: episode.id.toString(),
        uuid: episode.uuid,
        name: episode.name,
        slug: episode.slug,
        role: episode.role,
        description: episode.description,
        duration: episode.duration,
        order: episode.order,
        is_active: episode.is_active,
        release_date: episode.release_date?.toISOString() ?? null,
        thumbnail_url: episode.thumbnail_url,
        cover: episode.cover,
        video_url: episode.video_url,
        video_id: episode.video_id,
        source_cdn: episode.source_cdn,
        token_expires_at: episode.token_expires_at?.toISOString() ?? null,
        created_at: episode.created_at?.toISOString() ?? null,
        updated_at: episode.updated_at?.toISOString() ?? null,
      })),
    })),
  };
}

export default async function Home() {
  const course = await getCourseContent();

  if (!course) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#10263b_0%,#09111b_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-white/50">
              Video Prime
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Curso nao encontrado</h1>
            <p className="mt-3 text-white/70">
              Nenhum conteudo ativo foi encontrado para o slug {COURSE_SLUG}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
            <div className="rounded-4xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-white/50">
                Video Prime
              </p>
              <h1 className="mt-4 text-3xl font-semibold">Carregando plataforma</h1>
            </div>
          </div>
        </main>
      }
    >
      <CourseHome course={serializeCourse(course)} />
    </Suspense>
  );
}
