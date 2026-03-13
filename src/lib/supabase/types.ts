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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
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
      };
    };
  };
};
