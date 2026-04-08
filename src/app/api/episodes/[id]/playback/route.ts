import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  buildStreamIframeUrl,
  extractCustomerCode,
} from "@/lib/cloudflare-stream";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_TTL_SECONDS = 6 * 60 * 60;

type CloudflareVideoResponse = {
  result?: {
    uid: string;
    preview?: string | null;
    thumbnail?: string | null;
    requireSignedURLs?: boolean;
    playback?: {
      hls?: string | null;
      dash?: string | null;
    };
  };
  success: boolean;
  errors?: Array<{ message?: string }>;
};

type CloudflareTokenResponse = {
  result?: {
    token: string;
  };
  success: boolean;
  errors?: Array<{ message?: string }>;
};

function getCloudflareConfig() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    throw new Error("Missing Cloudflare Stream credentials");
  }

  return { apiToken, accountId };
}

async function getVideoDetails(videoId: string) {
  const { apiToken, accountId } = getCloudflareConfig();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as CloudflareVideoResponse;

  if (!response.ok || !payload.success || !payload.result) {
    throw new Error(
      payload.errors?.[0]?.message || "Failed to fetch Cloudflare video details",
    );
  }

  return payload.result;
}

async function createSignedToken(videoId: string, expiresAt: Date) {
  const { apiToken, accountId } = getCloudflareConfig();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exp: Math.floor(expiresAt.getTime() / 1000),
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as CloudflareTokenResponse;

  if (!response.ok || !payload.success || !payload.result?.token) {
    throw new Error(
      payload.errors?.[0]?.message || "Failed to create Cloudflare signed token",
    );
  }

  return payload.result.token;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const episode = await prisma.episodes.findUnique({
      where: {
        id: BigInt(id),
      },
      select: {
        id: true,
        video_id: true,
        token: true,
        token_expires_at: true,
        should_refresh_token: true,
      },
    });

    if (!episode?.video_id) {
      return NextResponse.json(
        { error: "Episode video not found" },
        { status: 404 },
      );
    }

    const details = await getVideoDetails(episode.video_id);
    const customerCode = extractCustomerCode([
      details.preview,
      details.thumbnail,
      details.playback?.hls,
      details.playback?.dash,
    ]);

    if (!customerCode) {
      return NextResponse.json(
        { error: "Cloudflare customer code not found" },
        { status: 500 },
      );
    }

    const hasValidStoredToken =
      !!episode.token &&
      !!episode.token_expires_at &&
      episode.token_expires_at.getTime() > Date.now() + TOKEN_REFRESH_BUFFER_MS;

    let streamId = episode.video_id;
    let signed = false;
    let expiresAt: Date | null = null;

    if (details.requireSignedURLs) {
      signed = true;

      if (hasValidStoredToken && !episode.should_refresh_token) {
        streamId = episode.token!;
        expiresAt = episode.token_expires_at!;
      } else {
        expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
        streamId = await createSignedToken(episode.video_id, expiresAt);

        await prisma.episodes.update({
          where: {
            id: episode.id,
          },
          data: {
            token: streamId,
            token_expires_at: expiresAt,
            should_refresh_token: false,
          },
        });
      }
    } else if (hasValidStoredToken) {
      signed = true;
      streamId = episode.token!;
      expiresAt = episode.token_expires_at!;
    }

    return NextResponse.json({
      customerCode,
      streamId,
      iframeUrl: buildStreamIframeUrl(customerCode, streamId),
      watchUrl: `https://customer-${customerCode}.cloudflarestream.com/${streamId}/watch`,
      thumbnailUrl: details.thumbnail ?? null,
      signed,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to build episode playback", error);

    return NextResponse.json(
      {
        error: "Failed to build episode playback",
      },
      { status: 500 },
    );
  }
}
