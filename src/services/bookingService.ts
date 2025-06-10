import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Booking } from "../lib/types";
import type { Database } from "../lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

// Transform database row to frontend Booking type
const transformBookingFromDB = (
  booking: BookingRow,
  property?: any,
  guest?: any,
): Booking => ({
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
  property: property || { id: booking.property_id },
  guest: guest || { id: booking.guest_id },
  createdAt: booking.created_at,
});

export const bookingService = {
  // Create new booking
  async createBooking(bookingData: {
    propertyId: string;
    guestId: string;
    hostId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    specialRequests?: string;
  }): Promise<Booking> {
    try {
      // First check availability
      const isAvailable = await this.checkAvailability(
        bookingData.propertyId,
        bookingData.checkIn,
        bookingData.checkOut,
      );

      if (!isAvailable) {
        throw new Error("Property is not available for the selected dates");
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            property_id: bookingData.propertyId,
            guest_id: bookingData.guestId,
            host_id: bookingData.hostId,
            check_in: bookingData.checkIn,
            check_out: bookingData.checkOut,
            guests: bookingData.guests,
            total_price: bookingData.totalPrice,
            special_requests: bookingData.specialRequests,
            status: "pending",
            payment_status: "pending",
          },
        ])
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .single();

      if (error) throw error;

      return transformBookingFromDB(data, data.properties, data.guest);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email,
            phone
          ),
          host:host_id (
            id,
            first_name,
            last_name,
            avatar,
            email,
            phone
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data
        ? transformBookingFromDB(data, data.properties, data.guest)
        : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get bookings for a guest
  async getGuestBookings(guestId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          properties:property_id (*),
          host:host_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((booking) =>
          transformBookingFromDB(booking, booking.properties, { id: guestId }),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get bookings for a host
  async getHostBookings(hostId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((booking) =>
          transformBookingFromDB(booking, booking.properties, booking.guest),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update booking status
  async updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "completed",
    cancellationReason?: string,
  ): Promise<Booking> {
    try {
      const updateData: BookingUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }

      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id)
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .single();

      if (error) throw error;

      return transformBookingFromDB(data, data.properties, data.guest);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update payment status
  async updatePaymentStatus(
    id: string,
    paymentStatus: "pending" | "paid" | "refunded",
  ): Promise<Booking> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .single();

      if (error) throw error;

      return transformBookingFromDB(data, data.properties, data.guest);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Check availability for dates
  async checkAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"])
        .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`)
        .limit(1);

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get upcoming bookings
  async getUpcomingBookings(
    userId: string,
    isHost: boolean = false,
  ): Promise<Booking[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const column = isHost ? "host_id" : "guest_id";

      const { data, error } = await supabase
        .from("bookings")
        .select(
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
        )
        .eq(column, userId)
        .gte("check_in", today)
        .in("status", ["confirmed", "pending"])
        .order("check_in", { ascending: true });

      if (error) throw error;

      return (
        data?.map((booking) =>
          transformBookingFromDB(
            booking,
            booking.properties,
            isHost ? booking.guest : { id: userId },
          ),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get past bookings
  async getPastBookings(
    userId: string,
    isHost: boolean = false,
  ): Promise<Booking[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const column = isHost ? "host_id" : "guest_id";

      const { data, error } = await supabase
        .from("bookings")
        .select(
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
        )
        .eq(column, userId)
        .lt("check_out", today)
        .order("check_out", { ascending: false });

      if (error) throw error;

      return (
        data?.map((booking) =>
          transformBookingFromDB(
            booking,
            booking.properties,
            isHost ? booking.guest : { id: userId },
          ),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Cancel booking
  async cancelBooking(id: string, reason: string): Promise<Booking> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          *,
          properties:property_id (*),
          guest:guest_id (
            id,
            first_name,
            last_name,
            avatar,
            email
          )
        `,
        )
        .single();

      if (error) throw error;

      return transformBookingFromDB(data, data.properties, data.guest);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get booking analytics for admin
  async getBookingAnalytics(
    startDate: string,
    endDate: string,
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    statusBreakdown: Record<string, number>;
    dailyBookings: Array<{ date: string; count: number; revenue: number }>;
  }> {
    try {
      // Get total bookings and revenue
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("total_price, status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (bookingsError) throw bookingsError;

      const totalBookings = bookings?.length || 0;
      const totalRevenue =
        bookings?.reduce((sum, booking) => sum + booking.total_price, 0) || 0;
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Status breakdown
      const statusBreakdown =
        bookings?.reduce(
          (acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      // Daily bookings (simplified - you might want to group by actual dates)
      const dailyBookings =
        bookings?.reduce(
          (acc, booking) => {
            const date = booking.created_at.split("T")[0];
            const existing = acc.find((item) => item.date === date);
            if (existing) {
              existing.count++;
              existing.revenue += booking.total_price;
            } else {
              acc.push({ date, count: 1, revenue: booking.total_price });
            }
            return acc;
          },
          [] as Array<{ date: string; count: number; revenue: number }>,
        ) || [];

      return {
        totalBookings,
        totalRevenue,
        averageBookingValue,
        statusBreakdown,
        dailyBookings: dailyBookings.sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
