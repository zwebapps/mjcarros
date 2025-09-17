import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { generateContactFormEmail, ContactFormData } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'info@mjcarros.com';
    
    // Create professional email using the new template
    const contactFormData: ContactFormData = {
      name,
      email,
      phone,
      subject,
      message
    };
    
    const { subject: emailSubject, html } = generateContactFormEmail(contactFormData);
    
    try { 
      await sendMail(supportEmail, emailSubject, html); 
      console.log('✅ Professional contact form email sent successfully');
    } catch (e) { 
      console.warn('❌ sendMail failed', e); 
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CONTACT_FORM_ERROR", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}


