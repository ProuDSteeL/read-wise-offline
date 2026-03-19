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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      books: {
        Row: {
          about_author: string | null
          author: string
          categories: string[] | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          listen_time_min: number | null
          rating: number | null
          read_time_min: number | null
          status: Database["public"]["Enums"]["book_status"]
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
          why_read: Json | null
        }
        Insert: {
          about_author?: string | null
          author: string
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listen_time_min?: number | null
          rating?: number | null
          read_time_min?: number | null
          status?: Database["public"]["Enums"]["book_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
          why_read?: Json | null
        }
        Update: {
          about_author?: string | null
          author?: string
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listen_time_min?: number | null
          rating?: number | null
          read_time_min?: number | null
          status?: Database["public"]["Enums"]["book_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
          why_read?: Json | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          book_ids: string[] | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          order_index: number | null
          title: string
        }
        Insert: {
          book_ids?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          order_index?: number | null
          title: string
        }
        Update: {
          book_ids?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      key_ideas: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          order_index: number
          title: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_ideas_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          subscription_expires_at: string | null
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          subscription_expires_at?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          subscription_expires_at?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          audio_size_bytes: number | null
          audio_url: string | null
          book_id: string
          content: string | null
          created_at: string
          id: string
          published_at: string | null
          updated_at: string
        }
        Insert: {
          audio_size_bytes?: number | null
          audio_url?: string | null
          book_id: string
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          updated_at?: string
        }
        Update: {
          audio_size_bytes?: number | null
          audio_url?: string | null
          book_id?: string
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_downloads: {
        Row: {
          book_id: string
          content_type: Database["public"]["Enums"]["download_content_type"]
          downloaded_at: string
          id: string
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          content_type?: Database["public"]["Enums"]["download_content_type"]
          downloaded_at?: string
          id?: string
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          content_type?: Database["public"]["Enums"]["download_content_type"]
          downloaded_at?: string
          id?: string
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_downloads_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_highlights: {
        Row: {
          book_id: string
          color: string | null
          created_at: string
          id: string
          note: string | null
          text: string
          user_id: string
        }
        Insert: {
          book_id: string
          color?: string | null
          created_at?: string
          id?: string
          note?: string | null
          text: string
          user_id: string
        }
        Update: {
          book_id?: string
          color?: string | null
          created_at?: string
          id?: string
          note?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          audio_position_ms: number | null
          book_id: string
          id: string
          scroll_position: number | null
          progress_percent: number | null
          last_read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_position_ms?: number | null
          book_id: string
          id?: string
          scroll_position?: number | null
          progress_percent?: number | null
          last_read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_position_ms?: number | null
          book_id?: string
          id?: string
          scroll_position?: number | null
          progress_percent?: number | null
          last_read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          book_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_shelves: {
        Row: {
          book_id: string
          created_at: string
          id: string
          shelf: Database["public"]["Enums"]["shelf_type"]
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          shelf: Database["public"]["Enums"]["shelf_type"]
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          shelf?: Database["public"]["Enums"]["shelf_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shelves_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      book_status: "draft" | "published" | "archived"
      download_content_type: "text" | "audio" | "both"
      shelf_type: "favorite" | "read" | "want_to_read"
      subscription_type: "free" | "pro_monthly" | "pro_yearly"
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
    Enums: {
      app_role: ["admin", "user"],
      book_status: ["draft", "published", "archived"],
      download_content_type: ["text", "audio", "both"],
      shelf_type: ["favorite", "read", "want_to_read"],
      subscription_type: ["free", "pro_monthly", "pro_yearly"],
    },
  },
} as const
