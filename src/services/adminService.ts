import { supabase, handleSupabaseError } from "../lib/supabase";
import type { User, Property, Booking } from "../lib/types";

export interface AdminDashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    hostsCount: number;
    guestsCount: number;
    verifiedUsers: number;
  };
  properties: {
    total: number;
    active: number;
    newThisMonth: number;
    averageRating: number;
    topCities: Array<{ city: string; count: number }>;
  };
  bookings: {
    total: number;
    thisMonth: number;
    revenue: number;
    revenueThisMonth: number;
    averageBookingValue: number;
    statusBreakdown: Record<string, number>;
  };
  reviews: {
    total: number;
    thisMonth: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
  growth: {
    userGrowth: Array<{ month: string; users: number; hosts: number }>;
    revenueGrowth: Array<{ month: string; revenue: number; bookings: number }>;
    propertyGrowth: Array<{ month: string; properties: number }>;
  };
}

export interface AdminUser extends User {
  totalBookings: number;
  totalSpent: number;
  totalEarned: number;
  lastLoginDate?: string;
  joinedDate: string;
}

export const adminService = {
  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

      // Users statistics
      const { data: allUsers } = await supabase.from("users").select("*");
      const { data: newUsersThisMonth } = await supabase
        .from("users")
        .select("*")
        .gte("created_at", firstDayOfMonth.toISOString());

      const usersStats = {
        total: allUsers?.length || 0,
        newThisMonth: newUsersThisMonth?.length || 0,
        hostsCount: allUsers?.filter((u) => u.is_host).length || 0,
        guestsCount: allUsers?.filter((u) => !u.is_host).length || 0,
        verifiedUsers: allUsers?.filter((u) => u.is_verified).length || 0,
      };

      // Properties statistics
      const { data: allProperties } = await supabase
        .from("properties")
        .select("*");
      const { data: newPropertiesThisMonth } = await supabase
        .from("properties")
        .select("*")
        .gte("created_at", firstDayOfMonth.toISOString());

      const averagePropertyRating = allProperties?.length
        ? allProperties.reduce((sum, p) => sum + (p.rating || 0), 0) /
          allProperties.length
        : 0;

      const topCities =
        allProperties?.reduce(
          (acc, property) => {
            const city = property.city;
            acc[city] = (acc[city] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const topCitiesArray = Object.entries(topCities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      const propertiesStats = {
        total: allProperties?.length || 0,
        active: allProperties?.filter((p) => p.is_active).length || 0,
        newThisMonth: newPropertiesThisMonth?.length || 0,
        averageRating: Math.round(averagePropertyRating * 10) / 10,
        topCities: topCitiesArray,
      };

      // Bookings statistics
      const { data: allBookings } = await supabase.from("bookings").select("*");
      const { data: bookingsThisMonth } = await supabase
        .from("bookings")
        .select("*")
        .gte("created_at", firstDayOfMonth.toISOString());

      const totalRevenue =
        allBookings?.reduce((sum, b) => sum + b.total_price, 0) || 0;
      const revenueThisMonth =
        bookingsThisMonth?.reduce((sum, b) => sum + b.total_price, 0) || 0;
      const averageBookingValue = allBookings?.length
        ? totalRevenue / allBookings.length
        : 0;

      const statusBreakdown =
        allBookings?.reduce(
          (acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const bookingsStats = {
        total: allBookings?.length || 0,
        thisMonth: bookingsThisMonth?.length || 0,
        revenue: totalRevenue,
        revenueThisMonth,
        averageBookingValue,
        statusBreakdown,
      };

      // Reviews statistics
      const { data: allReviews } = await supabase.from("reviews").select("*");
      const { data: reviewsThisMonth } = await supabase
        .from("reviews")
        .select("*")
        .gte("created_at", firstDayOfMonth.toISOString());

      const averageReviewRating = allReviews?.length
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      const ratingDistribution =
        allReviews?.reduce(
          (acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        ) || {};

      const reviewsStats = {
        total: allReviews?.length || 0,
        thisMonth: reviewsThisMonth?.length || 0,
        averageRating: Math.round(averageReviewRating * 10) / 10,
        ratingDistribution,
      };

      // Growth statistics (last 12 months)
      const growthStats = await this.getGrowthStatistics();

      return {
        users: usersStats,
        properties: propertiesStats,
        bookings: bookingsStats,
        reviews: reviewsStats,
        growth: growthStats,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get growth statistics for charts
  async getGrowthStatistics(): Promise<{
    userGrowth: Array<{ month: string; users: number; hosts: number }>;
    revenueGrowth: Array<{ month: string; revenue: number; bookings: number }>;
    propertyGrowth: Array<{ month: string; properties: number }>;
  }> {
    try {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
          end: new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
          ).toISOString(),
          label: date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
        });
      }

      // User growth
      const userGrowth = await Promise.all(
        months.map(async (month) => {
          const { data: users } = await supabase
            .from("users")
            .select("is_host")
            .gte("created_at", month.start)
            .lte("created_at", month.end);

          return {
            month: month.label,
            users: users?.length || 0,
            hosts: users?.filter((u) => u.is_host).length || 0,
          };
        }),
      );

      // Revenue growth
      const revenueGrowth = await Promise.all(
        months.map(async (month) => {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("total_price")
            .gte("created_at", month.start)
            .lte("created_at", month.end)
            .eq("status", "completed");

          return {
            month: month.label,
            revenue: bookings?.reduce((sum, b) => sum + b.total_price, 0) || 0,
            bookings: bookings?.length || 0,
          };
        }),
      );

      // Property growth
      const propertyGrowth = await Promise.all(
        months.map(async (month) => {
          const { data: properties } = await supabase
            .from("properties")
            .select("id")
            .gte("created_at", month.start)
            .lte("created_at", month.end);

          return {
            month: month.label,
            properties: properties?.length || 0,
          };
        }),
      );

      return {
        userGrowth,
        revenueGrowth,
        propertyGrowth,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get users with additional admin info
  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    users: AdminUser[];
    total: number;
  }> {
    try {
      let query = supabase.from("users").select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      const { count } = await query.select("*", { count: "exact", head: true });

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: users, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get additional data for each user
      const adminUsers = await Promise.all(
        (users || []).map(async (user) => {
          // Get booking statistics
          const { data: guestBookings } = await supabase
            .from("bookings")
            .select("total_price")
            .eq("guest_id", user.id);

          const { data: hostBookings } = await supabase
            .from("bookings")
            .select("total_price")
            .eq("host_id", user.id);

          const totalBookings =
            (guestBookings?.length || 0) + (hostBookings?.length || 0);
          const totalSpent =
            guestBookings?.reduce((sum, b) => sum + b.total_price, 0) || 0;
          const totalEarned =
            hostBookings?.reduce((sum, b) => sum + b.total_price, 0) || 0;

          return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar,
            phone: user.phone,
            isHost: user.is_host,
            isVerified: user.is_verified,
            joinedDate: user.joined_date,
            rating: user.rating,
            reviewCount: user.review_count,
            totalBookings,
            totalSpent,
            totalEarned,
          };
        }),
      );

      return { users: adminUsers, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get properties with admin info
  async getProperties(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    properties: Property[];
    total: number;
  }> {
    try {
      let query = supabase.from("properties").select(
        `
          *,
          users:host_id (
            id,
            first_name,
            last_name,
            avatar,
            rating,
            review_count,
            is_verified
          )
        `,
        { count: "exact" },
      );

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`,
        );
      }

      const { count } = await query.select("*", { count: "exact", head: true });

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const properties =
        data?.map((property) => ({
          id: property.id,
          hostId: property.host_id,
          title: property.title,
          description: property.description,
          type: property.type,
          location: {
            address: property.address,
            city: property.city,
            state: property.state,
            country: property.country,
            latitude: property.latitude || 0,
            longitude: property.longitude || 0,
          },
          pricing: {
            basePrice: property.base_price,
            cleaningFee: property.cleaning_fee,
            serviceFee: property.service_fee,
            currency: property.currency,
          },
          capacity: {
            guests: property.guests,
            bedrooms: property.bedrooms,
            beds: property.beds,
            bathrooms: property.bathrooms,
          },
          amenities: property.amenities || [],
          images: property.images || [],
          availability: {
            minStay: property.min_stay,
            maxStay: property.max_stay,
            instantBook: property.instant_book,
          },
          rules: property.rules || [],
          rating: property.rating || 0,
          reviewCount: property.review_count,
          host: property.users,
          createdAt: property.created_at,
          updatedAt: property.updated_at,
        })) || [];

      return { properties, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get bookings with admin info
  async getBookings(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{
    bookings: Booking[];
    total: number;
  }> {
    try {
      let query = supabase.from("bookings").select(
        `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          ),
          host:host_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        { count: "exact" },
      );

      if (status) {
        query = query.eq("status", status);
      }

      const { count } = await query.select("*", { count: "exact", head: true });

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookings =
        data?.map((booking) => ({
          id: booking.id,
          propertyId: booking.property_id,
          guestId: booking.guest_id,
          hostId: booking.host_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guests: booking.guests,
          totalPrice: booking.total_price,
          status: booking.status,
          paymentStatus: booking.payment_status,
          property: booking.properties,
          guest: booking.guest,
          createdAt: booking.created_at,
        })) || [];

      return { bookings, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Verify user
  async verifyUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Suspend user
  async suspendUser(userId: string, reason?: string): Promise<void> {
    try {
      // In a full implementation, you might have a suspended status
      // For now, we'll use analytics events to track this
      await supabase.from("analytics_events").insert([
        {
          user_id: userId,
          event_type: "user_suspended",
          event_data: { reason, suspended_at: new Date().toISOString() },
        },
      ]);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Deactivate property
  async deactivateProperty(propertyId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", propertyId);

      if (error) throw error;

      // Log the action
      await supabase.from("analytics_events").insert([
        {
          event_type: "property_deactivated",
          event_data: { property_id: propertyId, reason },
        },
      ]);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get platform analytics
  async getPlatformAnalytics(
    startDate: string,
    endDate: string,
  ): Promise<{
    userSignups: Array<{ date: string; count: number }>;
    bookingVolume: Array<{ date: string; count: number; revenue: number }>;
    propertyListings: Array<{ date: string; count: number }>;
    searchActivity: Array<{
      date: string;
      searches: number;
      unique_searches: number;
    }>;
    topSearchTerms: Array<{ term: string; count: number }>;
    conversionRate: number;
    averageBookingValue: number;
    hostRetentionRate: number;
    guestRetentionRate: number;
  }> {
    try {
      // This would be implemented based on your analytics requirements
      // For now, returning mock structure
      return {
        userSignups: [],
        bookingVolume: [],
        propertyListings: [],
        searchActivity: [],
        topSearchTerms: [],
        conversionRate: 0,
        averageBookingValue: 0,
        hostRetentionRate: 0,
        guestRetentionRate: 0,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Export data for admin
  async exportData(
    type: "users" | "properties" | "bookings" | "reviews",
    format: "csv" | "json" = "csv",
  ): Promise<string> {
    try {
      let data: any[] = [];

      switch (type) {
        case "users":
          const { data: users } = await supabase.from("users").select("*");
          data = users || [];
          break;
        case "properties":
          const { data: properties } = await supabase
            .from("properties")
            .select("*");
          data = properties || [];
          break;
        case "bookings":
          const { data: bookings } = await supabase
            .from("bookings")
            .select("*");
          data = bookings || [];
          break;
        case "reviews":
          const { data: reviews } = await supabase.from("reviews").select("*");
          data = reviews || [];
          break;
      }

      if (format === "json") {
        return JSON.stringify(data, null, 2);
      } else {
        // Convert to CSV (simplified implementation)
        if (data.length === 0) return "";

        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(","),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                return typeof value === "string"
                  ? `"${value.replace(/"/g, '""')}"`
                  : value;
              })
              .join(","),
          ),
        ];

        return csvRows.join("\n");
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
