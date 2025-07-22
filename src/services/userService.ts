import { supabase, handleSupabaseError } from "../lib/supabase";
import type { User } from "../lib/types";
import type { Database } from "../lib/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

// Transform database row to frontend User type
const transformUserFromDB = (user: UserRow): User => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  avatar: user.avatar || undefined,
  phone: user.phone || undefined,
  isHost: user.is_host,
  isVerified: user.is_verified,
  joinedDate: user.joined_date,
  rating: user.rating || undefined,
  reviewCount: user.review_count,
});

export const userService = {
  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        if (error.code === "42P01") {
          // Table doesn't exist yet
          console.warn("Users table not found. Please apply database schema.");
          return null;
        }
        throw error;
      }

      return data ? transformUserFromDB(data) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data ? transformUserFromDB(data) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create new user profile
  async createUserProfile(userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  }): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            id: userData.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            avatar: userData.avatar,
            phone: userData.phone,
            is_host: false,
            is_verified: false,
            joined_date: new Date().toISOString(),
            review_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return transformUserFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update user profile
  async updateUserProfile(
    id: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      phone?: string;
      bio?: string;
      languages?: string[];
    },
  ): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          first_name: updateData.firstName,
          last_name: updateData.lastName,
          avatar: updateData.avatar,
          phone: updateData.phone,
          bio: updateData.bio,
          languages: updateData.languages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return transformUserFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Toggle host status
  async toggleHostStatus(id: string, isHost: boolean): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_host: isHost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return transformUserFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Verify user
  async verifyUser(id: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return transformUserFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user statistics for host dashboard
  async getUserStats(userId: string): Promise<{
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
    responseRate: number;
    activeListings: number;
    totalGuests: number;
  }> {
    try {
      // Get booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("total_price, guests, status")
        .eq("host_id", userId);

      if (bookingsError) throw bookingsError;

      // Get property stats
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id")
        .eq("host_id", userId)
        .eq("is_active", true);

      if (propertiesError) throw propertiesError;

      // Get user rating
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("rating, response_rate")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const completedBookings =
        bookings?.filter((b) => b.status === "completed") || [];
      const totalBookings = completedBookings.length;
      const totalEarnings = completedBookings.reduce(
        (sum, booking) => sum + booking.total_price,
        0,
      );
      const totalGuests = completedBookings.reduce(
        (sum, booking) => sum + booking.guests,
        0,
      );

      return {
        totalBookings,
        totalEarnings,
        averageRating: user?.rating || 0,
        responseRate: user?.response_rate || 0,
        activeListings: properties?.length || 0,
        totalGuests,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Search users (for admin)
  async searchUsers(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    users: User[];
    total: number;
  }> {
    try {
      let supabaseQuery = supabase
        .from("users")
        .select("*", { count: "exact" });

      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`,
        );
      }

      // Get total count
      const { count } = await supabaseQuery.select("*", {
        count: "exact",
        head: true,
      });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabaseQuery
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const users = data?.map(transformUserFromDB) || [];

      return { users, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get all hosts
  async getHosts(
    page = 1,
    limit = 20,
  ): Promise<{
    hosts: User[];
    total: number;
  }> {
    try {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_host", true);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_host", true)
        .range(from, to)
        .order("rating", { ascending: false, nullsLast: true });

      if (error) throw error;

      const hosts = data?.map(transformUserFromDB) || [];

      return { hosts, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update user response rate and time
  async updateResponseMetrics(
    userId: string,
    responseRate: number,
    responseTime: string,
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          response_rate: responseRate,
          response_time: responseTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user dashboard data
  async getUserDashboardData(userId: string): Promise<{
    upcomingBookings: number;
    totalBookings: number;
    unreadMessages: number;
    pendingReviews: number;
    totalEarnings?: number;
    occupancyRate?: number;
  }> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get booking counts
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("status, check_in, total_price")
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

      const upcomingBookings =
        allBookings?.filter(
          (b) => b.check_in >= today && b.status === "confirmed",
        ).length || 0;

      const totalBookings = allBookings?.length || 0;

      // Get unread messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("receiver_id", userId)
        .eq("read", false);

      const unreadMessages = messages?.length || 0;

      // Get pending reviews (bookings that need reviews)
      const { data: completedBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("guest_id", userId)
        .eq("status", "completed")
        .lt("check_out", today);

      // Count how many don't have reviews yet
      const bookingIds = completedBookings?.map((b) => b.id) || [];
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds)
        .eq("reviewer_id", userId);

      const reviewedBookingIds = new Set(
        existingReviews?.map((r) => r.booking_id) || [],
      );
      const pendingReviews = bookingIds.filter(
        (id) => !reviewedBookingIds.has(id),
      ).length;

      // Calculate earnings for hosts
      let totalEarnings;
      let occupancyRate;

      const { data: hostBookings } = await supabase
        .from("bookings")
        .select("total_price, check_in, check_out")
        .eq("host_id", userId)
        .eq("status", "completed");

      if (hostBookings && hostBookings.length > 0) {
        totalEarnings = hostBookings.reduce(
          (sum, booking) => sum + booking.total_price,
          0,
        );

        // Calculate occupancy rate (simplified)
        const daysThisYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const bookedDays = hostBookings.reduce((sum, booking) => {
          const checkIn = new Date(booking.check_in);
          const checkOut = new Date(booking.check_out);
          return (
            sum +
            Math.floor(
              (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
            )
          );
        }, 0);

        occupancyRate =
          daysThisYear > 0 ? (bookedDays / daysThisYear) * 100 : 0;
      }

      return {
        upcomingBookings,
        totalBookings,
        unreadMessages,
        pendingReviews,
        totalEarnings,
        occupancyRate,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user activity log
  async getUserActivity(
    userId: string,
    limit = 50,
  ): Promise<
    Array<{
      id: string;
      eventType: string;
      eventData: any;
      createdAt: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, event_type, event_data, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((event) => ({
          id: event.id,
          eventType: event.event_type,
          eventData: event.event_data,
          createdAt: event.created_at,
        })) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
