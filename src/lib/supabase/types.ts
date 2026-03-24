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
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
