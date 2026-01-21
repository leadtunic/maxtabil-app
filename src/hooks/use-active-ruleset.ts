import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { getDefaultPayload } from "@/lib/rulesets";
import type { RuleSet, RuleSetKey } from "@/types";

export function useActiveRuleSet(simulatorKey: RuleSetKey) {
  return useQuery({
    queryKey: ["rulesets", "active", simulatorKey],
    queryFn: async () => {
      const response = await apiRequest<{ ruleset: RuleSet | null }>(
        `/api/rulesets/active?simulatorKey=${encodeURIComponent(simulatorKey)}`
      );

      if (!response?.ruleset) {
        return {
          ruleset: null,
          payload: getDefaultPayload(simulatorKey),
          isFallback: true,
        };
      }

      return {
        ruleset: response.ruleset as RuleSet,
        payload: response.ruleset.payload as Record<string, unknown>,
        isFallback: false,
      };
    },
  });
}
