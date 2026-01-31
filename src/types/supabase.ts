/**
 * Supabase Database Types for MVP Multi-tenant SaaS
 * Auto-generated types for tables used in the application
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ModuleKey =
  | "financeiro"
  | "financeiro_bpo"
  | "dp"
  | "fiscal_contabil"
  | "legalizacao"
  | "certificado_digital"
  | "admin";

export type EnabledModules = {
  [key in ModuleKey]?: boolean;
};

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          logo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          slug: string;
          logo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          slug?: string;
          logo_path?: string | null;
          created_at?: string;
        };
      };
      workspace_settings: {
        Row: {
          workspace_id: string;
          enabled_modules: EnabledModules;
          completed_onboarding: boolean;
          branding: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          enabled_modules?: EnabledModules;
          completed_onboarding?: boolean;
          branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          enabled_modules?: EnabledModules;
          completed_onboarding?: boolean;
          branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      entitlements: {
        Row: {
          workspace_id: string;
          lifetime_access: boolean;
          lifetime_paid_at: string | null;
          abacate_billing_id: string | null;
          abacate_status: string | null;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          lifetime_access?: boolean;
          lifetime_paid_at?: string | null;
          abacate_billing_id?: string | null;
          abacate_status?: string | null;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          lifetime_access?: boolean;
          lifetime_paid_at?: string | null;
          abacate_billing_id?: string | null;
          abacate_status?: string | null;
          updated_at?: string;
        };
      };
      allowed_emails: {
        Row: {
          email: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          email: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          email: string;
          display_name: string;
          role: string;
          is_active: boolean;
          must_change_password: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name: string;
          role: string;
          is_active?: boolean;
          must_change_password?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          display_name?: string;
          role?: string;
          is_active?: boolean;
          must_change_password?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          actor_user_id: string | null;
          actor_email: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      rulesets: {
        Row: {
          id: string;
          workspace_id: string | null;
          simulator_key: string;
          name: string;
          version: number;
          is_active: boolean;
          payload: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          simulator_key: string;
          name: string;
          version: number;
          is_active?: boolean;
          payload: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          simulator_key?: string;
          name?: string;
          version?: number;
          is_active?: boolean;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_links: {
        Row: {
          id: string;
          workspace_id: string | null;
          title: string;
          url: string;
          category: string;
          sector: string | null;
          is_active: boolean;
          sort_order: number;
          clicks: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          title: string;
          url: string;
          category?: string;
          sector?: string | null;
          is_active?: boolean;
          sort_order?: number;
          clicks?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          title?: string;
          url?: string;
          category?: string;
          sector?: string | null;
          is_active?: boolean;
          sort_order?: number;
          clicks?: number;
          updated_at?: string;
        };
      };
      home_recados: {
        Row: {
          id: string;
          workspace_id: string | null;
          title: string;
          content: string;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          title: string;
          content: string;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          title?: string;
          content?: string;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      legal_documents: {
        Row: {
          id: string;
          workspace_id: string;
          type: string;
          issuer: string | null;
          number: string | null;
          issued_at: string | null;
          expires_at: string;
          status: string;
          notes: string | null;
          attachment_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          issuer?: string | null;
          number?: string | null;
          issued_at?: string | null;
          expires_at: string;
          status?: string;
          notes?: string | null;
          attachment_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          type?: string;
          issuer?: string | null;
          number?: string | null;
          issued_at?: string | null;
          expires_at?: string;
          status?: string;
          notes?: string | null;
          attachment_path?: string | null;
          created_at?: string;
        };
      };
      digital_certificates: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          provider: string | null;
          type: string | null;
          expires_at: string;
          owner: string | null;
          attachment_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          provider?: string | null;
          type?: string | null;
          expires_at: string;
          owner?: string | null;
          attachment_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          provider?: string | null;
          type?: string | null;
          expires_at?: string;
          owner?: string | null;
          attachment_path?: string | null;
          created_at?: string;
        };
      };
      bpo_clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          document: string | null;
          segment: string | null;
          monthly_fee: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          document?: string | null;
          segment?: string | null;
          monthly_fee?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          document?: string | null;
          segment?: string | null;
          monthly_fee?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      bpo_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          title: string;
          category: string;
          due_date: string;
          status: string;
          priority: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          title: string;
          category: string;
          due_date: string;
          status?: string;
          priority?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          client_id?: string;
          title?: string;
          category?: string;
          due_date?: string;
          status?: string;
          priority?: string;
          created_at?: string;
        };
      };
      bpo_sla_rules: {
        Row: {
          workspace_id: string;
          default_due_days: number;
          late_after_hours: number;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          default_due_days?: number;
          late_after_hours?: number;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          default_due_days?: number;
          late_after_hours?: number;
          updated_at?: string;
        };
      };
    };
    Functions: {
      increment_link_clicks: {
        Args: { link_id: string };
        Returns: undefined;
      };
    };
  };
}

// Convenience types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceSettings = Database["public"]["Tables"]["workspace_settings"]["Row"];
export type Entitlement = Database["public"]["Tables"]["entitlements"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type RuleSetRow = Database["public"]["Tables"]["rulesets"]["Row"];
export type AppLink = Database["public"]["Tables"]["app_links"]["Row"];
export type HomeRecado = Database["public"]["Tables"]["home_recados"]["Row"];
export type LegalDocument = Database["public"]["Tables"]["legal_documents"]["Row"];
export type DigitalCertificate = Database["public"]["Tables"]["digital_certificates"]["Row"];
export type BpoClient = Database["public"]["Tables"]["bpo_clients"]["Row"];
export type BpoTask = Database["public"]["Tables"]["bpo_tasks"]["Row"];
export type BpoSlaRules = Database["public"]["Tables"]["bpo_sla_rules"]["Row"];
