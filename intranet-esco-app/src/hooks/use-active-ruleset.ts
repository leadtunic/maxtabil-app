import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDefaultPayload } from "@/lib/rulesets";
import type { RuleSet, RuleSetKey } from "@/types";

export function useActiveRuleSet(simulatorKey: RuleSetKey) {
  return useQuery({
    queryKey: ["rulesets", "active", simulatorKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rulesets")
        .select("*")
        .eq("simulator_key", simulatorKey)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          ruleset: null,
          payload: getDefaultPayload(simulatorKey),
          isFallback: true,
        };
      }

      return {
        ruleset: data as RuleSet,
        payload: data.payload as Record<string, unknown>,
        isFallback: false,
      };
    },
  });
}
