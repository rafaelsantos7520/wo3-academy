import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const COURSE_SLUG = "curso-wo3";

const getCachedCourseContent = unstable_cache(
  async () =>
    prisma.contents.findFirst({
    where: {
      is_active: true,
      OR: [
        { slug: COURSE_SLUG },
        { categories: { slug: COURSE_SLUG } },
        {
          content_categories: {
            some: {
              categories: {
                slug: COURSE_SLUG,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      release_date: true,
      categories: {
        select: {
          name: true,
          slug: true,
        },
      },
      content_types: {
        select: {
          name: true,
          slug: true,
          description: true,
          cover: true,
          is_active: true,
        },
      },
      content_categories: {
        select: {
          categories: {
            select: {
              name: true,
              slug: true,
              description: true,
              cover: true,
              is_active: true,
              is_root: true,
            },
          },
        },
      },
      modules: {
        where: {
          is_active: true,
        },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          uuid: true,
          name: true,
          slug: true,
          role: true,
          description: true,
          order: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          episodes: {
            where: {
              is_active: true,
            },
            orderBy: [{ order: "asc" }, { id: "asc" }],
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              role: true,
              description: true,
              duration: true,
              order: true,
              is_active: true,
              release_date: true,
              thumbnail_url: true,
              cover: true,
              video_url: true,
              video_id: true,
              source_cdn: true,
              token_expires_at: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      },
    },
    }),
  ["course-content", COURSE_SLUG],
  {
    revalidate: 300,
  },
);

export async function getCourseContent() {
  return getCachedCourseContent();
}
