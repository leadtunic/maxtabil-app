import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    return timingSafeEqual(encoder.encode(expectedSignature), encoder.encode(signature));
  } catch {
    return false;
  }
}

serve(async (req) => {
  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const webhookSecret = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook secret via query param
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    
    if (webhookSecret && querySecret !== webhookSecret) {
      console.error("Invalid webhook secret");
      return new Response("Unauthorized", { status: 401 });
    }

    // Optional: Verify HMAC signature
    const signature = req.headers.get("X-Webhook-Signature");
    const hmacKey = Deno.env.get("ABACATEPAY_WEBHOOK_PUBLIC_HMAC_KEY");
    
    if (signature && hmacKey) {
      const isValid = await verifySignature(rawBody, signature, hmacKey);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    console.log("Received webhook event:", JSON.stringify(event, null, 2));

    const eventType = event.event || event.type;
    const billing = event.data?.billing || event.billing || event.data;

    // Only process billing.paid events
    if (eventType !== "billing.paid" && eventType !== "BILLING_PAID") {
      console.log(`Ignoring event type: ${eventType}`);
      return new Response("OK", { status: 200 });
    }

    const billingId = billing?.id;
    const metadata = billing?.metadata || {};
    const workspaceId = metadata.workspace_id;

    if (!billingId) {
      console.error("No billing ID in event");
      return new Response("Missing billing ID", { status: 400 });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Find entitlement by billing ID or workspace ID
    let targetWorkspaceId = workspaceId;
    
    if (!targetWorkspaceId) {
      const { data: entitlement } = await supabase
        .from("entitlements")
        .select("workspace_id")
        .eq("abacate_billing_id", billingId)
        .single();
      
      targetWorkspaceId = entitlement?.workspace_id;
    }

    if (!targetWorkspaceId) {
      console.error("Could not find workspace for billing:", billingId);
      return new Response("Workspace not found", { status: 404 });
    }

    // Update entitlement
    const { error: updateError } = await supabase
      .from("entitlements")
      .update({
        lifetime_access: true,
        lifetime_paid_at: new Date().toISOString(),
        abacate_status: "PAID",
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", targetWorkspaceId);

    if (updateError) {
      console.error("Error updating entitlement:", updateError);
      return new Response("Failed to update entitlement", { status: 500 });
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      workspace_id: targetWorkspaceId,
      actor_user_id: metadata.user_id || null,
      actor_email: null,
      action: "BILLING_PAID",
      entity_type: "entitlement",
      entity_id: targetWorkspaceId,
      metadata: {
        billing_id: billingId,
        event_type: eventType,
        raw_event: event,
      },
    });

    console.log(`Successfully activated lifetime access for workspace: ${targetWorkspaceId}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
