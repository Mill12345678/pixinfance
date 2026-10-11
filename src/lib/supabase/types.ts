// Hand-written types matching supabase_schema.sql (PRD v2).
// Regenerate with: supabase gen types typescript --project-id <ref> --schema public > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'accountant';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'admin' | 'accountant';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'accountant';
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          transaction_date: string;
          transaction_type: 'income' | 'expense' | 'transfer';
          niche: 'ai' | 'stem' | 'chung';
          actual_amount: number;
          invoiced_amount: number;
          vat_amount: number;
          source_account: 'company_bank' | 'personal_bank' | 'cash';
          document_status: 'has_invoice' | 'pending_invoice' | 'no_invoice';
          document_url: string | null;
          category: string | null;
          contract_id: string | null;
          evidence_pending: boolean;
          notes: string | null;
          debt_impact: number;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          transaction_date: string;
          transaction_type: 'income' | 'expense' | 'transfer';
          niche: 'ai' | 'stem' | 'chung';
          actual_amount: number;
          invoiced_amount?: number;
          vat_amount?: number;
          source_account: 'company_bank' | 'personal_bank' | 'cash';
          document_status?: 'has_invoice' | 'pending_invoice' | 'no_invoice';
          document_url?: string | null;
          category?: string | null;
          contract_id?: string | null;
          evidence_pending?: boolean;
          notes?: string | null;
          debt_impact?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          transaction_date?: string;
          transaction_type?: 'income' | 'expense' | 'transfer';
          niche?: 'ai' | 'stem' | 'chung';
          actual_amount?: number;
          invoiced_amount?: number;
          vat_amount?: number;
          source_account?: 'company_bank' | 'personal_bank' | 'cash';
          document_status?: 'has_invoice' | 'pending_invoice' | 'no_invoice';
          document_url?: string | null;
          category?: string | null;
          contract_id?: string | null;
          evidence_pending?: boolean;
          notes?: string | null;
          debt_impact?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          transaction_id: string;
          url: string;
          file_type: 'image' | 'pdf' | 'link';
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          url: string;
          file_type: 'image' | 'pdf' | 'link';
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          url?: string;
          file_type?: 'image' | 'pdf' | 'link';
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          name: string;
          parent_phone: string | null;
          parent_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_phone?: string | null;
          parent_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_phone?: string | null;
          parent_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'transaction_created' | 'invoice_alert' | 'debt_alert' | 'system';
          title: string;
          body: string | null;
          transaction_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'transaction_created' | 'invoice_alert' | 'debt_alert' | 'system';
          title: string;
          body?: string | null;
          transaction_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'transaction_created' | 'invoice_alert' | 'debt_alert' | 'system';
          title?: string;
          body?: string | null;
          transaction_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_settings: {
        Row: {
          key: string;
          value: number;
        };
        Insert: {
          key: string;
          value: number;
        };
        Update: {
          key?: string;
          value?: number;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          direction: 'income' | 'expense';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          direction: 'income' | 'expense';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          direction?: 'income' | 'expense';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
