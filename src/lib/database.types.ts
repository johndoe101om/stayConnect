export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar: string | null;
          phone: string | null;
          is_host: boolean;
          is_verified: boolean;
          joined_date: string;
          rating: number | null;
          review_count: number;
          bio: string | null;
          languages: string[] | null;
          response_rate: number | null;
          response_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar?: string | null;
          phone?: string | null;
          is_host?: boolean;
          is_verified?: boolean;
          joined_date?: string;
          rating?: number | null;
          review_count?: number;
          bio?: string | null;
          languages?: string[] | null;
          response_rate?: number | null;
          response_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          avatar?: string | null;
          phone?: string | null;
          is_host?: boolean;
          is_verified?: boolean;
          joined_date?: string;
          rating?: number | null;
          review_count?: number;
          bio?: string | null;
          languages?: string[] | null;
          response_rate?: number | null;
          response_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          description: string;
          type: "entire-home" | "private-room" | "shared-room";
          address: string;
          city: string;
          state: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          base_price: number;
          cleaning_fee: number;
          service_fee: number;
          currency: string;
          guests: number;
          bedrooms: number;
          beds: number;
          bathrooms: number;
          amenities: string[];
          images: string[];
          min_stay: number;
          max_stay: number;
          instant_book: boolean;
          rules: string[];
          rating: number | null;
          review_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          description: string;
          type: "entire-home" | "private-room" | "shared-room";
          address: string;
          city: string;
          state: string;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          base_price: number;
          cleaning_fee?: number;
          service_fee?: number;
          currency?: string;
          guests: number;
          bedrooms: number;
          beds: number;
          bathrooms: number;
          amenities?: string[];
          images?: string[];
          min_stay?: number;
          max_stay?: number;
          instant_book?: boolean;
          rules?: string[];
          rating?: number | null;
          review_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          title?: string;
          description?: string;
          type?: "entire-home" | "private-room" | "shared-room";
          address?: string;
          city?: string;
          state?: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          base_price?: number;
          cleaning_fee?: number;
          service_fee?: number;
          currency?: string;
          guests?: number;
          bedrooms?: number;
          beds?: number;
          bathrooms?: number;
          amenities?: string[];
          images?: string[];
          min_stay?: number;
          max_stay?: number;
          instant_book?: boolean;
          rules?: string[];
          rating?: number | null;
          review_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          property_id: string;
          guest_id: string;
          host_id: string;
          check_in: string;
          check_out: string;
          guests: number;
          total_price: number;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          payment_status: "pending" | "paid" | "refunded";
          special_requests: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          guest_id: string;
          host_id: string;
          check_in: string;
          check_out: string;
          guests: number;
          total_price: number;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          payment_status?: "pending" | "paid" | "refunded";
          special_requests?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          guest_id?: string;
          host_id?: string;
          check_in?: string;
          check_out?: string;
          guests?: number;
          total_price?: number;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          payment_status?: "pending" | "paid" | "refunded";
          special_requests?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          property_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string;
          type: "guest-to-host" | "host-to-guest";
          accuracy_rating: number | null;
          communication_rating: number | null;
          cleanliness_rating: number | null;
          location_rating: number | null;
          checkin_rating: number | null;
          value_rating: number | null;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          property_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string;
          type: "guest-to-host" | "host-to-guest";
          accuracy_rating?: number | null;
          communication_rating?: number | null;
          cleanliness_rating?: number | null;
          location_rating?: number | null;
          checkin_rating?: number | null;
          value_rating?: number | null;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          property_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string;
          type?: "guest-to-host" | "host-to-guest";
          accuracy_rating?: number | null;
          communication_rating?: number | null;
          cleanliness_rating?: number | null;
          location_rating?: number | null;
          checkin_rating?: number | null;
          value_rating?: number | null;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          booking_id: string | null;
          content: string;
          message_type: "text" | "image" | "booking_request" | "system";
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          booking_id?: string | null;
          content: string;
          message_type?: "text" | "image" | "booking_request" | "system";
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          booking_id?: string | null;
          content?: string;
          message_type?: "text" | "image" | "booking_request" | "system";
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist_properties: {
        Row: {
          id: string;
          wishlist_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          property_id?: string;
          created_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          category: "general" | "tips" | "events" | "local_insights";
          tags: string[];
          likes_count: number;
          comments_count: number;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          content: string;
          category?: "general" | "tips" | "events" | "local_insights";
          tags?: string[];
          likes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          category?: "general" | "tips" | "events" | "local_insights";
          tags?: string[];
          likes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id: string | null;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id?: string | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_id?: string | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          event_data: Json;
          page_url: string | null;
          referrer: string | null;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          event_data?: Json;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          event_data?: Json;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          amount: number;
          currency: string;
          payment_method: string;
          payment_status: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id: string | null;
          refund_amount: number | null;
          refund_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          amount: number;
          currency?: string;
          payment_method: string;
          payment_status?: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          amount?: number;
          currency?: string;
          payment_method?: string;
          payment_status?: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
  };
}
