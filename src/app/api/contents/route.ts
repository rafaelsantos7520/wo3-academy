import { NextRequest, NextResponse } from "next/server";

import { COURSE_SLUG, getCourseContent } from "@/lib/course-content";

export async function GET(request: NextRequest) {
  const onlyActiveParam = request.nextUrl.searchParams.get("active");
  const onlyActive = onlyActiveParam !== "false";

  try {
    const content = await getCourseContent();
    const data =
      content && (onlyActive || content.modules.length > 0)
        ? [
            {
              id: content.id.toString(),
              title: content.title,
              slug: content.slug,
              description: content.description,
              release_date: content.release_date?.toISOString() ?? null,
              categories: {
                primary: content.categories,
                related: content.content_categories.map(
                  ({ categories }) => categories,
                ),
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
                  token_expires_at:
                    episode.token_expires_at?.toISOString() ?? null,
                  created_at: episode.created_at?.toISOString() ?? null,
                  updated_at: episode.updated_at?.toISOString() ?? null,
                })),
              })),
            },
          ]
        : [];

    return NextResponse.json({
      data,
      meta: {
        count: data.length,
        filters: {
          slug: COURSE_SLUG,
          active: onlyActive,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch contents", error);

    return NextResponse.json(
      {
        error: "Failed to fetch contents",
      },
      { status: 500 },
    );
  }
}
