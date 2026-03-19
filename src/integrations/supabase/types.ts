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
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          read_time_minutes: number | null
          search_vector: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          why_read: string | null
        }
        Insert: {
          about_author?: string | null
          author: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          read_time_minutes?: number | null
          search_vector?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          why_read?: string | null
        }
        Update: {
          about_author?: string | null
          author?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          read_time_minutes?: number | null
          search_vector?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          why_read?: string | null
        }
        Relationships: []
      }
      book_categories: {
        Row: {
          book_id: string
          category_id: string
        }
        Insert: {
          book_id: string
          category_id: string
        }
        Update: {
          book_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_categories_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          display_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          display_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          display_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          display_order: number | null
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          display_order?: number | null
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          display_order?: number | null
          title?: string
        }
        Relationships: []
      }
      collection_books: {
        Row: {
          collection_id: string
          book_id: string
          display_order: number | null
        }
        Insert: {
          collection_id: string
          book_id: string
          display_order?: number | null
        }
        Update: {
          collection_id?: string
          book_id?: string
          display_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_books_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_progress: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          book_id: string
          mastered: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          book_id: string
          mastered?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          book_id?: string
          mastered?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          id: string
          book_id: string
          front: string
          back: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          front: string
          back: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          front?: string
          back?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      key_ideas: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          display_order: number
          title: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          display_order?: number
          title: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          display_order?: number
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
      payments: {
        Row: {
          id: string
          user_id: string
          yoomoney_payment_id: string | null
          amount_rub: number | null
          status: string | null
          raw_webhook: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          yoomoney_payment_id?: string | null
          amount_rub?: number | null
          status?: string | null
          raw_webhook?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          yoomoney_payment_id?: string | null
          amount_rub?: number | null
          status?: string | null
          raw_webhook?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string | null
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          book_id: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          question?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: number
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          book_id: string
          score: number
          total_questions: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          score: number
          total_questions: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          score?: number
          total_questions?: number
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: string | null
          status: string | null
          started_at: string | null
          expires_at: string | null
          yoomoney_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: string | null
          status?: string | null
          started_at?: string | null
          expires_at?: string | null
          yoomoney_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string | null
          status?: string | null
          started_at?: string | null
          expires_at?: string | null
          yoomoney_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          audio_size_bytes: number | null
          audio_url: string | null
          book_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          audio_size_bytes?: number | null
          audio_url?: string | null
          book_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          audio_size_bytes?: number | null
          audio_url?: string | null
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          word_count?: number | null
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
          downloaded_at: string
          id: string
          file_size_bytes: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          downloaded_at?: string
          id?: string
          file_size_bytes?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          downloaded_at?: string
          id?: string
          file_size_bytes?: number | null
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
          position_start: number | null
          position_end: number | null
          text: string
          user_id: string
        }
        Insert: {
          book_id: string
          color?: string | null
          created_at?: string
          id?: string
          note?: string | null
          position_start?: number | null
          position_end?: number | null
          text: string
          user_id: string
        }
        Update: {
          book_id?: string
          color?: string | null
          created_at?: string
          id?: string
          note?: string | null
          position_start?: number | null
          position_end?: number | null
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
      user_shelves: {
        Row: {
          book_id: string
          id: string
          shelf_type: string
          user_id: string
        }
        Insert: {
          book_id: string
          id?: string
          shelf_type: string
          user_id: string
        }
        Update: {
          book_id?: string
          id?: string
          shelf_type?: string
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
