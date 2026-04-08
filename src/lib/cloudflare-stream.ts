export function extractCustomerCode(urls: Array<string | null | undefined>) {
  for (const url of urls) {
    if (!url) {
      continue;
    }

    try {
      const hostname = new URL(url).hostname;
      const match = hostname.match(/^customer-([^.]+)\.cloudflarestream\.com$/);

      if (match?.[1]) {
        return match[1];
      }
    } catch {}
  }

  return null;
}

export function buildStreamIframeUrl(customerCode: string, streamId: string) {
  return `https://customer-${customerCode}.cloudflarestream.com/${streamId}/iframe`;
}
