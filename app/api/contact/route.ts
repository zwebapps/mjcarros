import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    // TODO: integrate with a mail service (SendGrid, Resend, SES). For now we just acknowledge.
    console.log("CONTACT_FORM", { name, email, phone, subject, message });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CONTACT_FORM_ERROR", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}


