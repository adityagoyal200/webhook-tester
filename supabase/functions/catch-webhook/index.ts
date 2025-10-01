// Supabase Edge Function: catch-webhook
// Receives incoming HTTP requests and logs them to webhook_requests
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

// Convert FormData to a JSON-safe object (avoids non-serializable File values)
function formDataToJsonSafe(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      obj[key] = value;
    } else if (value instanceof File) {
      obj[key] = { name: value.name, type: value.type, size: value.size };
    } else {
      obj[key] = String(value);
    }
  }
  return obj;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 5 chars):', supabaseKey?.substring(0, 5));

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const webhookId = pathSegments[pathSegments.indexOf("catch-webhook") + 1];
  console.log('Extracted Webhook ID:', webhookId);

  if (!webhookId) {
    return new Response(JSON.stringify({ error: "Missing webhook id in path" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Confirm webhook exists (support id or identifier/name in path)
  // Avoid PostgREST "Cannot coerce the result to a single JSON object" by not using .single()
  const { data: webhooksData, error: whError } = await supabase
    .from("webhooks")
    .select("id, user_id, settings, secret_key, name")
    .or(`id.eq.${webhookId},name.eq.${webhookId}`)
    .limit(1);
  const webhook = Array.isArray(webhooksData) ? webhooksData[0] : null;
  console.log('Webhook lookup result:', webhook);

  if (whError || !webhook) {
    return new Response(JSON.stringify({ error: "Webhook not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Extract payload safely
  let payload: any = null;
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      payload = formDataToJsonSafe(form);
    } else {
      const text = await req.text();
      payload = text ? { raw: text } : null;
    }
  } catch (_) {
    payload = null;
  }

  const headersObj = Object.fromEntries(req.headers.entries());
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || null;

  // Insert request record
  const { error: insertError } = await supabase.from("webhook_requests").insert([
    {
      webhook_id: String(webhook.id),
      method: req.method,
      headers: headersObj,
      payload,
      response_status: 200,
      status: 200,
      processing_time_ms: 0,
      ip_address: ip,
      user_agent: userAgent,
    },
  ]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ ok: true, webhook_id: webhookId }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});