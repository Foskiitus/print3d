import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const SUPPORT_EMAIL = "support@spooliq.app";
const FROM_EMAIL = "noreply@spooliq.app"; // substitui pelo teu domínio verificado no Resend

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        reply_to: email,
        subject: `[SpoolIQ Contact] ${subject}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f4f4f5;border-radius:12px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#18181b;">Nova mensagem de contacto</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#71717a;width:80px;">Nome</td>
                <td style="padding:8px 0;font-size:13px;color:#18181b;font-weight:500;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#71717a;">Email</td>
                <td style="padding:8px 0;font-size:13px;color:#18181b;">
                  <a href="mailto:${email}" style="color:#3b82f6;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#71717a;">Assunto</td>
                <td style="padding:8px 0;font-size:13px;color:#18181b;">${subject}</td>
              </tr>
            </table>
            <div style="background:#fff;border-radius:8px;padding:16px;font-size:14px;color:#3f3f46;line-height:1.7;white-space:pre-wrap;">${message}</div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
