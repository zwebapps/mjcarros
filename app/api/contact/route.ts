import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'info@mjcarros.com';
    const html = `
      <div>
        <h3>New contact form submission</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || ''}</p>
        <p><b>Subject:</b> ${subject || ''}</p>
        <p><b>Message:</b><br/>${(message || '').replace(/\n/g, '<br/>')}</p>
      </div>
    `;
    try { await sendMail(supportEmail, `Contact: ${subject || 'Message'}`, html); } catch (e) { console.warn('sendMail failed', e); }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CONTACT_FORM_ERROR", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}


