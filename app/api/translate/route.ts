import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHUNK = 450;

function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const chunks: string[] = [];
  const parts = text.split(/(\n\n+)/);
  let buf = "";
  for (const part of parts) {
    if ((buf + part).length <= MAX_CHUNK) {
      buf += part;
    } else {
      if (buf) chunks.push(buf);
      if (part.length <= MAX_CHUNK) {
        buf = part;
      } else {
        for (let i = 0; i < part.length; i += MAX_CHUNK) {
          chunks.push(part.slice(i, i + MAX_CHUNK));
        }
        buf = "";
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks.filter(Boolean);
}

async function translateChunk(text: string, target: string): Promise<string> {
  const langpair = target === "pt" ? "en|pt-PT" : "pt-PT|en";
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Translation service error (${res.status})`);

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };
  const translated = data?.responseData?.translatedText?.trim();
  if (!translated) throw new Error("Empty translation response");
  return translated;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const target = body?.target === "en" ? "en" : "pt";

    if (!text) {
      return NextResponse.json({ translated: "" });
    }

    if (text.length > 12000) {
      return NextResponse.json(
        { error: "Text too long to translate" },
        { status: 400 }
      );
    }

    const chunks = chunkText(text);
    const parts: string[] = [];
    for (const chunk of chunks) {
      parts.push(await translateChunk(chunk, target));
    }

    return NextResponse.json({ translated: parts.join("") });
  } catch (e) {
    console.error("[translate]", e);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 502 }
    );
  }
}
