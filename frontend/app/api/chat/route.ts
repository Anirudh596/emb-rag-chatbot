import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();
  const message = body.message as string;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_BACKEND_URL" },
      { status: 500 },
    );
  }

  const upstream = await fetch(`${backendUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Backend error" },
      { status: upstream.status },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
