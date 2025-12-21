import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackEmailRequest {
  to: string;
  nama: string;
  nim: string;
  jurusan: string;
  feedback: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, nama, nim, jurusan, feedback }: FeedbackEmailRequest = await req.json();

    console.log("Sending feedback email to:", to);

    const jurusanLabels: Record<string, string> = {
      akuntansi: "Akuntansi",
      manajemen: "Manajemen",
      perbankan_syariah: "Perbankan Syariah",
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "E-Submission Skripsi <onboarding@resend.dev>",
        to: [to],
        subject: "Feedback Submission Skripsi Anda",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .feedback-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
              .info-row { margin: 8px 0; }
              .label { font-weight: bold; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">E-Submission Skripsi</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Feedback dari Admin</p>
              </div>
              <div class="content">
                <p>Halo <strong>${nama}</strong>,</p>
                <p>Terima kasih telah mengirimkan data skripsi Anda. Berikut adalah feedback dari admin:</p>
                
                <div style="margin: 20px 0;">
                  <div class="info-row"><span class="label">NIM:</span> ${nim}</div>
                  <div class="info-row"><span class="label">Jurusan:</span> ${jurusanLabels[jurusan] || jurusan}</div>
                </div>
                
                <div class="feedback-box">
                  <strong>Feedback:</strong>
                  <p style="margin: 10px 0 0 0; white-space: pre-line;">${feedback}</p>
                </div>
                
                <p>Silakan login ke sistem untuk melihat detail lebih lanjut dan melakukan tindak lanjut jika diperlukan.</p>
                
                <p>Salam,<br><strong>Tim Admin E-Submission Skripsi</strong></p>
              </div>
              <div class="footer">
                <p style="margin: 0;">© 2024 E-Submission Skripsi. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
