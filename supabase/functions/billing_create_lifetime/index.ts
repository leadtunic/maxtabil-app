import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LIFETIME_PRICE_CENTS = 99700; // R$ 997,00

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const abacateApiKey = Deno.env.get("ABACATEPAY_API_KEY")!;
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://app.example.com";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get workspace for this user
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("owner_user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return new Response(JSON.stringify({ error: "Workspace not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already has entitlement
    const { data: existingEntitlement } = await supabase
      .from("entitlements")
      .select("lifetime_access, abacate_billing_id")
      .eq("workspace_id", workspace.id)
      .single();

    if (existingEntitlement?.lifetime_access) {
      return new Response(JSON.stringify({ error: "Already has lifetime access" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create AbacatePay billing
    const externalId = `${workspace.id}:${user.id}:${Date.now()}`;
    
    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: "lifetime",
          name: "Acesso Vitalício - Painel de Gestão",
          description: "Acesso vitalício ao painel de gestão com todos os módulos",
          quantity: 1,
          price: LIFETIME_PRICE_CENTS,
        },
      ],
      returnUrl: `${appBaseUrl}/paywall`,
      completionUrl: `${appBaseUrl}/billing/completed`,
      customer: {
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Cliente",
        email: user.email!,
      },
      externalId,
      metadata: {
        workspace_id: workspace.id,
        user_id: user.id,
      },
    };

    const abacateResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billingPayload),
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error("AbacatePay error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create billing", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billingResult = await abacateResponse.json();
    const billingId = billingResult.data?.id || billingResult.id;
    const paymentUrl = billingResult.data?.url || billingResult.url;

    // Update entitlements with pending status using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
    
    await supabaseAdmin.from("entitlements").upsert({
      workspace_id: workspace.id,
      lifetime_access: false,
      abacate_billing_id: billingId,
      abacate_status: "PENDING",
      updated_at: new Date().toISOString(),
    });

    // Log audit
    await supabaseAdmin.from("audit_logs").insert({
      workspace_id: workspace.id,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "CHECKOUT_STARTED",
      entity_type: "billing",
      entity_id: billingId,
      metadata: { external_id: externalId, price_cents: LIFETIME_PRICE_CENTS },
    });

    return new Response(
      JSON.stringify({
        paymentUrl,
        billingId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
