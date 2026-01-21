import { apiRequest } from "@/lib/api";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
  workspaceId?: string | null,
): Promise<void> {
  try {
    await apiRequest("/api/audit", {
      method: "POST",
      body: {
        action,
        entityType,
        entityId,
        metadata,
        workspaceId: workspaceId ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
