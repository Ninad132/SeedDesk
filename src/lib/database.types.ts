export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          company_id: string;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          preferred_language: "en" | "hi";
          role: "owner" | "admin" | "staff";
          updated_at: string;
        };
        Insert: {
          company_id: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          preferred_language?: "en" | "hi";
          role?: "owner" | "admin" | "staff";
        };
        Update: Partial<Database["public"]["Tables"]["app_users"]["Insert"]>;
      };
      companies: {
        Row: {
          address: string | null;
          created_at: string;
          default_language: "en" | "hi";
          id: string;
          legal_name: string | null;
          name: string;
          phone: string | null;
          seed_license_number: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          default_language?: "en" | "hi";
          id?: string;
          legal_name?: string | null;
          name: string;
          phone?: string | null;
          seed_license_number?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      company_settings: {
        Row: {
          allow_negative_stock: boolean;
          company_id: string;
          created_at: string;
          currency_code: string;
          invoice_prefix: string;
          next_invoice_number: number;
          show_hindi_invoice_labels: boolean;
          updated_at: string;
        };
        Insert: {
          allow_negative_stock?: boolean;
          company_id: string;
          currency_code?: string;
          invoice_prefix?: string;
          next_invoice_number?: number;
          show_hindi_invoice_labels?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Insert"]>;
      };
      customers: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          mobile: string | null;
          name: string;
          notes: string | null;
          opening_balance: number;
          updated_at: string;
          village: string | null;
        };
        Insert: {
          company_id: string;
          id?: string;
          mobile?: string | null;
          name: string;
          notes?: string | null;
          opening_balance?: number;
          village?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      invoice_items: {
        Row: {
          amount: number;
          bags: number;
          company_id: string;
          id: string;
          invoice_id: string;
          item_name: string;
          packing_kg: number;
          quantity_quintal: number;
          rate: number;
          seed_lot_id: string | null;
        };
        Insert: {
          bags: number;
          company_id: string;
          id?: string;
          invoice_id: string;
          item_name: string;
          packing_kg: number;
          rate: number;
          seed_lot_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
      };
      invoices: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          customer_name: string;
          discount_amount: number;
          due_amount: number;
          grand_total: number;
          id: string;
          invoice_date: string;
          invoice_number: number;
          invoice_prefix: string;
          mobile: string | null;
          notes: string | null;
          paid_amount: number;
          status: "draft" | "final" | "cancelled";
          subtotal: number;
          updated_at: string;
          village: string | null;
        };
        Insert: {
          company_id: string;
          created_by?: string | null;
          customer_id?: string | null;
          customer_name: string;
          discount_amount?: number;
          due_amount?: number;
          grand_total?: number;
          id?: string;
          invoice_date: string;
          invoice_number: number;
          invoice_prefix?: string;
          mobile?: string | null;
          notes?: string | null;
          paid_amount?: number;
          status?: "draft" | "final" | "cancelled";
          subtotal?: number;
          village?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      payments: {
        Row: {
          amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          id: string;
          invoice_id: string | null;
          mode: "cash" | "bank" | "card" | "credit_adjustment";
          notes: string | null;
          payment_date: string;
          reference: string | null;
        };
        Insert: {
          amount: number;
          company_id: string;
          created_by?: string | null;
          customer_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          mode: "cash" | "bank" | "card" | "credit_adjustment";
          notes?: string | null;
          payment_date: string;
          reference?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      products: {
        Row: {
          company_id: string;
          created_at: string;
          crop: string;
          default_packing_kg: number;
          default_rate: number;
          display_name: string;
          id: string;
          is_active: boolean;
          updated_at: string;
          variety_name: string;
        };
        Insert: {
          company_id: string;
          crop?: string;
          default_packing_kg?: number;
          default_rate?: number;
          display_name: string;
          id?: string;
          is_active?: boolean;
          variety_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      seed_lots: {
        Row: {
          company_id: string;
          created_at: string;
          current_bags: number;
          grading_session_id: string | null;
          hold_bags: number;
          id: string;
          inward_slip_id: string | null;
          lot_number: string;
          opening_bags: number;
          packing_kg: number;
          packing_session_id: string | null;
          product_id: string;
          rate: number;
          received_at: string | null;
          seed_class: string | null;
          source_state: string | null;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          current_bags?: number;
          grading_session_id?: string | null;
          hold_bags?: number;
          id?: string;
          inward_slip_id?: string | null;
          lot_number: string;
          opening_bags?: number;
          packing_kg?: number;
          packing_session_id?: string | null;
          product_id: string;
          rate?: number;
          received_at?: string | null;
          seed_class?: string | null;
          source_state?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["seed_lots"]["Insert"]>;
      };
      stock_adjustments: {
        Row: {
          adjustment_date: string;
          adjustment_type: "add" | "remove" | "hold" | "release";
          bags: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          reason: string;
          seed_lot_id: string;
        };
        Insert: {
          adjustment_date: string;
          adjustment_type: "add" | "remove" | "hold" | "release";
          bags: number;
          company_id: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          reason: string;
          seed_lot_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_adjustments"]["Insert"]>;
      };
      inward_slips: {
        Row: {
          amount: number;
          bag_size: number;
          bag_wt: number;
          bags: number;
          bouncing: number;
          cash_amount: number;
          cheque_amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          datetime_in: string | null;
          datetime_out: string | null;
          first_wt: number;
          germination: number | null;
          id: string;
          material_name: string;
          moisture: number | null;
          net_weight_qtl: number;
          net_wt: number;
          rate: number;
          remark: string | null;
          second_wt: number;
          purchase_id: string | null;
          seed_lot_id: string | null;
          seed_type: "VS" | "TL";
          shift: string | null;
          slip_no: number;
          supplier_name: string;
          truck_no: string | null;
          updated_at: string;
          wgt_bag: number;
        };
        Insert: {
          amount?: number;
          bag_size?: number;
          bag_wt?: number;
          bags?: number;
          bouncing?: number;
          cash_amount?: number;
          cheque_amount?: number;
          company_id: string;
          created_by?: string | null;
          datetime_in?: string | null;
          datetime_out?: string | null;
          first_wt?: number;
          germination?: number | null;
          id?: string;
          material_name: string;
          moisture?: number | null;
          net_weight_qtl?: number;
          net_wt?: number;
          rate?: number;
          remark?: string | null;
          second_wt?: number;
          purchase_id?: string | null;
          seed_lot_id?: string | null;
          seed_type?: "VS" | "TL";
          shift?: string | null;
          slip_no: number;
          supplier_name: string;
          truck_no?: string | null;
          wgt_bag?: number;
        };
        Update: Partial<Database["public"]["Tables"]["inward_slips"]["Insert"]>;
      };
      grading_sessions: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          difference: number;
          final_graded: number;
          germination: number | null;
          graded_bag_size: number;
          graded_bags: number;
          graded_loose: number;
          graded_quantity: number;
          grading_date: string;
          id: string;
          inward_slip_id: string | null;
          location: string | null;
          moisture: number | null;
          remark: string | null;
          supplier_name: string;
          total_graded: number;
          undersize: number;
          undersize_percent: number;
          updated_at: string;
          us_bags: number;
          variety: string;
          weight_receipt: number;
        };
        Insert: {
          company_id: string;
          created_by?: string | null;
          difference?: number;
          final_graded?: number;
          germination?: number | null;
          graded_bag_size?: number;
          graded_bags?: number;
          graded_loose?: number;
          graded_quantity?: number;
          grading_date: string;
          id?: string;
          inward_slip_id?: string | null;
          location?: string | null;
          moisture?: number | null;
          remark?: string | null;
          supplier_name: string;
          total_graded?: number;
          undersize?: number;
          undersize_percent?: number;
          us_bags?: number;
          variety: string;
          weight_receipt?: number;
        };
        Update: Partial<Database["public"]["Tables"]["grading_sessions"]["Insert"]>;
      };
      packing_sessions: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          difference: number;
          germination: number | null;
          grading_session_id: string | null;
          ghamsi: number;
          graded_input: number;
          id: string;
          inward_slip_id: string | null;
          location: string | null;
          lot_no: string | null;
          moisture: number | null;
          no_of_bags: number;
          packed_quantity_before: number;
          packing_bag_size: number;
          packing_date: string;
          packing_loose: number;
          packing_quantity: number;
          rate: number;
          remaining_quantity: number;
          remark: string | null;
          seed_lot_id: string | null;
          seed_type: string;
          supplier_name: string;
          total_packed: number;
          updated_at: string;
          variety: string;
        };
        Insert: {
          company_id: string;
          created_by?: string | null;
          difference?: number;
          germination?: number | null;
          grading_session_id?: string | null;
          ghamsi?: number;
          graded_input?: number;
          id?: string;
          inward_slip_id?: string | null;
          location?: string | null;
          lot_no?: string | null;
          moisture?: number | null;
          no_of_bags?: number;
          packed_quantity_before?: number;
          packing_bag_size?: number;
          packing_date: string;
          packing_loose?: number;
          packing_quantity?: number;
          rate?: number;
          remaining_quantity?: number;
          remark?: string | null;
          seed_lot_id?: string | null;
          seed_type?: string;
          supplier_name: string;
          total_packed?: number;
          variety: string;
        };
        Update: Partial<Database["public"]["Tables"]["packing_sessions"]["Insert"]>;
      };
    };
    Views: {
      customer_balances: {
        Row: {
          company_id: string | null;
          customer_id: string | null;
          "Customer name": string | null;
          "Difference": number | null;
          "GRAND TOTAL": number | null;
          "Mobile No": string | null;
          "Opening Difference": number | null;
          "Received": number | null;
          "Village": string | null;
        };
      };
      sale_sheet_rows: {
        Row: Record<string, Json>;
      };
      seed_lot_availability: {
        Row: Record<string, Json>;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
