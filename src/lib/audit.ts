import { supabase } from "@/lib/supabase";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
  workspaceId?: string | null,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("audit_logs").insert({
    workspace_id: workspaceId ?? null,
    actor_user_id: user.id,
    actor_email: user.email ?? "",
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });

  if (error) {
    console.error("Audit log error:", error);
  }
}
