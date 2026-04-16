export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      inspections: {
        Row: {
          created_at: string
          date_inspection: string | null
          document_url: string | null
          effectuee_par: string | null
          id: string
          notes_inspection: string | null
          prochaine_inspection: string | null
          resultat: string
          type_inspection: string
          unite_id: string
        }
        Insert: {
          created_at?: string
          date_inspection?: string | null
          document_url?: string | null
          effectuee_par?: string | null
          id?: string
          notes_inspection?: string | null
          prochaine_inspection?: string | null
          resultat?: string
          type_inspection: string
          unite_id: string
        }
        Update: {
          created_at?: string
          date_inspection?: string | null
          document_url?: string | null
          effectuee_par?: string | null
          id?: string
          notes_inspection?: string | null
          prochaine_inspection?: string | null
          resultat?: string
          type_inspection?: string
          unite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_unite_id_fkey"
            columns: ["unite_id"]
            isOneToOne: false
            referencedRelation: "unites"
            referencedColumns: ["id"]
          },
        ]
      }
      unites: {
        Row: {
          annee: number | null
          assurance_expiration: string | null
          categorie: string | null
          couleur: string | null
          created_at: string
          date_acquisition: string | null
          date_deremisage: string | null
          date_disposition: string | null
          date_maj_km: string | null
          date_remisage: string | null
          demande_par: string | null
          entite: string
          id: string
          immatriculation_expiration: string | null
          km_achat: number | null
          km_actuel: number | null
          marque: string | null
          modele: string | null
          nb_essieux: string | null
          notes: string | null
          numero_serie: string | null
          numero_unite: string
          plaque: string | null
          pnvb: string | null
          poids: string | null
          prix_achat: number | null
          reservoir: boolean | null
          statut: string
        }
        Insert: {
          annee?: number | null
          assurance_expiration?: string | null
          categorie?: string | null
          couleur?: string | null
          created_at?: string
          date_acquisition?: string | null
          date_deremisage?: string | null
          date_disposition?: string | null
          date_maj_km?: string | null
          date_remisage?: string | null
          demande_par?: string | null
          entite: string
          id?: string
          immatriculation_expiration?: string | null
          km_achat?: number | null
          km_actuel?: number | null
          marque?: string | null
          modele?: string | null
          nb_essieux?: string | null
          notes?: string | null
          numero_serie?: string | null
          numero_unite: string
          plaque?: string | null
          pnvb?: string | null
          poids?: string | null
          prix_achat?: number | null
          reservoir?: boolean | null
          statut?: string
        }
        Update: {
          annee?: number | null
          assurance_expiration?: string | null
          categorie?: string | null
          couleur?: string | null
          created_at?: string
          date_acquisition?: string | null
          date_deremisage?: string | null
          date_disposition?: string | null
          date_maj_km?: string | null
          date_remisage?: string | null
          demande_par?: string | null
          entite?: string
          id?: string
          immatriculation_expiration?: string | null
          km_achat?: number | null
          km_actuel?: number | null
          marque?: string | null
          modele?: string | null
          nb_essieux?: string | null
          notes?: string | null
          numero_serie?: string | null
          numero_unite?: string
          plaque?: string | null
          pnvb?: string | null
          poids?: string | null
          prix_achat?: number | null
          reservoir?: boolean | null
          statut?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
