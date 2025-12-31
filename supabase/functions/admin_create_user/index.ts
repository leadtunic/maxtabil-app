import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const allowedRoles = ["ADMIN", "FINANCEIRO", "DP", "FISCAL_CONTABIL", "LEGALIZACAO_CERT"];
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return new Response("Missing Supabase configuration", { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active, email")
    .eq("user_id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "ADMIN" || !callerProfile.is_active) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const body = await req.json();
  const { email, password, display_name, role } = body ?? {};

  if (!email || !password || !display_name || !role) {
    return new Response("Missing required fields", { status: 400, headers: corsHeaders });
  }
  if (!allowedRoles.includes(role)) {
    return new Response("Invalid role", { status: 400, headers: corsHeaders });
  }

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return new Response(createError?.message ?? "Failed to create user", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    user_id: createdUser.user.id,
    email,
    display_name,
    role,
    is_active: true,
    must_change_password: true,
    created_by: user.id,
  });

  if (profileError) {
    return new Response(profileError.message, { status: 400, headers: corsHeaders });
  }

  await supabaseAdmin.from("audit_logs").insert({
    actor_user_id: user.id,
    actor_email: callerProfile.email ?? user.email ?? "",
    action: "USER_CREATED",
    entity_type: "profiles",
    entity_id: createdUser.user.id,
    metadata: { email, role },
  });

  return new Response(JSON.stringify({ user_id: createdUser.user.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
