import type { Context } from "https://edge.netlify.com";

const BOT_USER_AGENTS = [
  "facebookexternalhit", "Facebot", "Twitterbot", "LinkedInBot",
  "WhatsApp", "TelegramBot", "Slackbot", "Discordbot",
  "Pinterest", "Googlebot", "bingbot", "Applebot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!isBot(userAgent)) {
    return context.next();
  }

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/posts\/([a-zA-Z0-9_-]+)$/);
  if (!match) {
    return context.next();
  }

  const postId = match[1];
  const API_BASE = Deno.env.get("API_URL") ?? Deno.env.get("VITE_API_URL") ?? "";

  try {
    const metaRes = await fetch(`${API_BASE}/posts/${postId}/meta`, {
      headers: { Accept: "text/html" },
    });

    if (!metaRes.ok) return context.next();

    const html = await metaRes.text();
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "cache-control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return context.next();
  }
}
