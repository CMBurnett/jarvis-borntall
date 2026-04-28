export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppMountType = "module" | "iframe";

export type UserRole = "admin" | "user";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          org_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          org_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          org_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      instance_config: {
        Row: {
          id: string;
          instance_name: string;
          primary_color: string;
          logo_url: string | null;
          default_model_provider: string;
          default_model_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          instance_name?: string;
          primary_color?: string;
          logo_url?: string | null;
          default_model_provider?: string;
          default_model_name?: string;
        };
        Update: {
          instance_name?: string;
          primary_color?: string;
          logo_url?: string | null;
          default_model_provider?: string;
          default_model_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      apps: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string;
          version: string;
          mount_type: AppMountType;
          entry_point: string;
          permissions: string[];
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          icon?: string;
          version?: string;
          mount_type?: AppMountType;
          entry_point: string;
          permissions?: string[];
          enabled?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string;
          version?: string;
          enabled?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_usage: {
        Row: {
          id: string;
          user_id: string;
          app_id: string;
          last_used_at: string;
          use_count: number;
        };
        Insert: {
          user_id: string;
          app_id: string;
          last_used_at?: string;
          use_count?: number;
        };
        Update: {
          last_used_at?: string;
          use_count?: number;
        };
        Relationships: [];
      };
      app_favorites: {
        Row: {
          id: string;
          user_id: string;
          app_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          app_id: string;
        };
        Update: never;
        Relationships: [];
      };
      model_config: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          model_name: string;
          ollama_base_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider?: string;
          model_name?: string;
          ollama_base_url?: string | null;
        };
        Update: {
          provider?: string;
          model_name?: string;
          ollama_base_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      // ISO Ready tables
      organisations: {
        Row: { id: string; name: string; created_at: string };
        Insert: { name: string };
        Update: { name?: string };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          org_id: string | null;
          client_name: string;
          status: string;
          standards: string[];
          created_at: string;
        };
        Insert: {
          org_id?: string | null;
          client_name: string;
          status?: string;
          standards?: string[];
        };
        Update: {
          client_name?: string;
          status?: string;
          standards?: string[];
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          assessment_id: string | null;
          org_id: string | null;
          storage_path: string;
          filename: string;
          doc_type: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          assessment_id?: string | null;
          org_id?: string | null;
          storage_path: string;
          filename: string;
          doc_type?: string | null;
          status?: string;
        };
        Update: { status?: string };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          assessment_id: string | null;
          org_id: string | null;
          document_id: string | null;
          chunk_index: number | null;
          content: string;
          likely_clauses: string[] | null;
          created_at: string;
        };
        Insert: {
          assessment_id?: string | null;
          org_id?: string | null;
          document_id?: string | null;
          chunk_index?: number | null;
          content: string;
          likely_clauses?: string[] | null;
        };
        Update: { content?: string };
        Relationships: [];
      };
      iso_clauses: {
        Row: {
          id: string;
          standard: string;
          as9100_specific: boolean;
          section: string | null;
          title: string | null;
          shall_text: string | null;
          evidence_types: string[] | null;
          complexity: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      clause_assessments: {
        Row: {
          id: string;
          assessment_id: string | null;
          org_id: string | null;
          clause_id: string | null;
          provider: string;
          status: 'evidenced' | 'partial' | 'gap';
          evidence_summary: string | null;
          gap_description: string | null;
          action_item: string | null;
          priority: 1 | 2 | 3 | null;
          interview_questions: string[] | null;
          evidence_checks: Json | null;
          assessed_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      processing_jobs: {
        Row: {
          id: string;
          assessment_id: string | null;
          org_id: string | null;
          job_type: string | null;
          status: string;
          payload: Json | null;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          assessment_id?: string | null;
          org_id?: string | null;
          job_type?: string | null;
          status?: string;
          payload?: Json | null;
        };
        Update: {
          status?: string;
          error?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      // CRM tables
      crm_leads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          list_type: string | null;
          location: string | null;
          county: string | null;
          website: string | null;
          phone: string | null;
          status: string;
          priority: string | null;
          pain_points: string | null;
          notes: string | null;
          next_action: string | null;
          last_contacted_at: string | null;
          sector: string | null;
          employees: string | null;
          revenue: string | null;
          ownership: string | null;
          domain: string | null;
          email_format: string | null;
          outreach_channel: string | null;
          ai_use_case_1: string | null;
          ai_use_case_2: string | null;
          ai_use_case_3: string | null;
          buying_trigger: string | null;
          outreach_hook: string | null;
          cold_email_subject: string | null;
          likely_objection: string | null;
          est_sales_cycle: string | null;
          population: string | null;
          municipality_type: string | null;
        };
        Insert: {
          name: string;
          list_type?: string | null;
          location?: string | null;
          county?: string | null;
          website?: string | null;
          phone?: string | null;
          status?: string;
          priority?: string | null;
          pain_points?: string | null;
          notes?: string | null;
          next_action?: string | null;
          last_contacted_at?: string | null;
          sector?: string | null;
          employees?: string | null;
          revenue?: string | null;
          ownership?: string | null;
          domain?: string | null;
          email_format?: string | null;
          outreach_channel?: string | null;
          ai_use_case_1?: string | null;
          ai_use_case_2?: string | null;
          ai_use_case_3?: string | null;
          buying_trigger?: string | null;
          outreach_hook?: string | null;
          cold_email_subject?: string | null;
          likely_objection?: string | null;
          est_sales_cycle?: string | null;
          population?: string | null;
          municipality_type?: string | null;
        };
        Update: {
          name?: string;
          list_type?: string | null;
          location?: string | null;
          county?: string | null;
          website?: string | null;
          phone?: string | null;
          status?: string;
          priority?: string | null;
          pain_points?: string | null;
          notes?: string | null;
          next_action?: string | null;
          last_contacted_at?: string | null;
          sector?: string | null;
          employees?: string | null;
          revenue?: string | null;
          ownership?: string | null;
          domain?: string | null;
          email_format?: string | null;
          outreach_channel?: string | null;
          ai_use_case_1?: string | null;
          ai_use_case_2?: string | null;
          ai_use_case_3?: string | null;
          buying_trigger?: string | null;
          outreach_hook?: string | null;
          cold_email_subject?: string | null;
          likely_objection?: string | null;
          est_sales_cycle?: string | null;
          population?: string | null;
          municipality_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_lead_contacts: {
        Row: {
          id: string;
          created_at: string;
          lead_id: string | null;
          name: string;
          title: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          is_primary: boolean;
          notes: string | null;
        };
        Insert: {
          lead_id?: string | null;
          name: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          is_primary?: boolean;
          notes?: string | null;
        };
        Update: {
          lead_id?: string | null;
          name?: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          is_primary?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      crm_interactions: {
        Row: {
          id: string;
          created_at: string;
          lead_id: string | null;
          type: string | null;
          subject: string | null;
          body: string | null;
          email_message_id: string | null;
          ai_summary: string | null;
          ai_next_action: string | null;
          ai_sentiment: string | null;
          actioned_at: string | null;
        };
        Insert: {
          lead_id?: string | null;
          type?: string | null;
          subject?: string | null;
          body?: string | null;
          email_message_id?: string | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_sentiment?: string | null;
          actioned_at?: string | null;
        };
        Update: {
          lead_id?: string | null;
          type?: string | null;
          subject?: string | null;
          body?: string | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_sentiment?: string | null;
          actioned_at?: string | null;
        };
        Relationships: [];
      };
      crm_assessments: {
        Row: {
          id: string;
          submitted_at: string;
          lead_id: string | null;
          name: string | null;
          email: string | null;
          company: string | null;
          source_slug: string | null;
          source_type: string | null;
          answers: Json | null;
          resonates_with: string[] | null;
          timeline: string | null;
          win_criteria: string | null;
          additional_notes: string | null;
          ai_brief: string | null;
        };
        Insert: {
          lead_id?: string | null;
          name?: string | null;
          email?: string | null;
          company?: string | null;
          source_slug?: string | null;
          source_type?: string | null;
          answers?: Json | null;
          resonates_with?: string[] | null;
          timeline?: string | null;
          win_criteria?: string | null;
          additional_notes?: string | null;
          ai_brief?: string | null;
        };
        Update: {
          lead_id?: string | null;
          name?: string | null;
          email?: string | null;
          company?: string | null;
          answers?: Json | null;
          resonates_with?: string[] | null;
          timeline?: string | null;
          win_criteria?: string | null;
          additional_notes?: string | null;
          ai_brief?: string | null;
        };
        Relationships: [];
      };
      crm_email_sync_log: {
        Row: {
          id: string;
          synced_at: string;
          emails_found: number;
          emails_matched: number;
          emails_skipped: number;
          error: string | null;
        };
        Insert: {
          emails_found?: number;
          emails_matched?: number;
          emails_skipped?: number;
          error?: string | null;
        };
        Update: {
          emails_found?: number;
          emails_matched?: number;
          emails_skipped?: number;
          error?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_chunks: {
        Args: {
          query_embedding: string;
          assessment_id: string;
          match_count?: number;
        };
        Returns: { id: string; content: string; similarity: number }[];
      };
      match_chunks_local: {
        Args: {
          query_embedding: string;
          assessment_id: string;
          match_count?: number;
        };
        Returns: { id: string; content: string; similarity: number }[];
      };
      match_chunks_bge: {
        Args: {
          query_embedding: string;
          assessment_id: string;
          match_count?: number;
        };
        Returns: { id: string; content: string; similarity: number }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
