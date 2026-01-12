import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

// HTML escape function to prevent XSS in email content
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate jurusan against allowed values
const validJurusan = ['akuntansi', 'manajemen', 'perbankan_syariah'];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ==================== AUTHENTICATION CHECK ====================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth context
    const supabaseClient = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // ==================== ADMIN ROLE VERIFICATION ====================
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: 'Error verifying permissions' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!roleData) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin role verified for user:", user.id);

    // ==================== INPUT VALIDATION ====================
    const { to, nama, nim, jurusan, feedback }: FeedbackEmailRequest = await req.json();

    // Validate required fields
    if (!to || !nama || !nim || !jurusan || !feedback) {
      return new Response(
        JSON.stringify({ error: 'All fields are required: to, nama, nim, jurusan, feedback' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate feedback length (1-5000 characters)
    if (feedback.length < 1 || feedback.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Feedback must be between 1 and 5000 characters' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate nama length (1-200 characters)
    if (nama.length < 1 || nama.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 1 and 200 characters' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate NIM (1-50 characters, alphanumeric)
    if (nim.length < 1 || nim.length > 50 || !/^[a-zA-Z0-9]+$/.test(nim)) {
      return new Response(
        JSON.stringify({ error: 'NIM must be 1-50 alphanumeric characters' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate jurusan against allowed values
    if (!validJurusan.includes(jurusan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid jurusan value' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending feedback email to:", to);

    // ==================== SANITIZE INPUTS FOR HTML ====================
    const sanitizedNama = escapeHtml(nama);
    const sanitizedNim = escapeHtml(nim);
    const sanitizedFeedback = escapeHtml(feedback);

    const jurusanLabels: Record<string, string> = {
      akuntansi: "Akuntansi",
      manajemen: "Manajemen",
      perbankan_syariah: "Perbankan Syariah",
    };

    const sanitizedJurusanLabel = escapeHtml(jurusanLabels[jurusan] || jurusan);

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
                <p>Halo <strong>${sanitizedNama}</strong>,</p>
                <p>Terima kasih telah mengirimkan data skripsi Anda. Berikut adalah feedback dari admin:</p>
                
                <div style="margin: 20px 0;">
                  <div class="info-row"><span class="label">NIM:</span> ${sanitizedNim}</div>
                  <div class="info-row"><span class="label">Jurusan:</span> ${sanitizedJurusanLabel}</div>
                </div>
                
                <div class="feedback-box">
                  <strong>Feedback:</strong>
                  <p style="margin: 10px 0 0 0; white-space: pre-line;">${sanitizedFeedback}</p>
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
