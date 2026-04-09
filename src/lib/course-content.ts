import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertBigInts<T>(obj: T): T {
  if (typeof obj === "bigint") return Number(obj) as unknown as T;
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(convertBigInts) as unknown as T;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, convertBigInts(v)])
  ) as T;
}

export const COURSE_SLUG = "curso-wo3";

async function fetchCourseFromDB() {
  const result = await prisma.contents.findFirst({
    where: {
      is_active: true,
      OR: [
        { slug: COURSE_SLUG },
        { categories: { slug: COURSE_SLUG } },
        {
          content_categories: {
            some: { categories: { slug: COURSE_SLUG } },
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
      categories: { select: { name: true, slug: true } },
      content_types: {
        select: { name: true, slug: true, description: true, cover: true, is_active: true },
      },
      content_categories: {
        select: {
          categories: {
            select: { name: true, slug: true, description: true, cover: true, is_active: true, is_root: true },
          },
        },
      },
      modules: {
        where: { is_active: true },
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
            where: { is_active: true },
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
  });
  if (!result) return null;
  return convertBigInts(result);
}

const getCachedCourseContent = unstable_cache(
  fetchCourseFromDB,
  ["course-content", COURSE_SLUG],
  { revalidate: 300 },
);

export async function getCourseContent() {
  try {
    return await getCachedCourseContent();
  } catch {
    // Cache corrompido (comum em dev com HMR) — busca direto no banco
    return fetchCourseFromDB();
  }
}
