import { apiRequest } from "../lib/apiClient";
import type { Booking } from "../lib/types";

const transformBooking = (booking: any): Booking => ({
  id: booking.id,
  propertyId: booking.propertyId,
  guestId: booking.guestId,
  hostId: booking.hostId,
  checkIn: booking.checkIn,
  checkOut: booking.checkOut,
  guests: booking.guests,
  totalPrice: booking.totalPrice,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  property: booking.property || { id: booking.propertyId },
  guest: booking.guest || { id: booking.guestId },
  createdAt: booking.createdAtUtc || booking.createdAt || new Date().toISOString(),
});

export const bookingService = {
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
    const response = await apiRequest<any>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        propertyId: bookingData.propertyId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        totalPrice: bookingData.totalPrice,
        specialRequests: bookingData.specialRequests,
      }),
    });
    return transformBooking(response);
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const response = await apiRequest<any>(`/bookings/${id}`);
      return transformBooking(response);
    } catch (error: any) {
      if (String(error.message).includes("404")) return null;
      throw error;
    }
  },

  async getGuestBookings(guestId: string): Promise<Booking[]> {
    const response = await apiRequest<any[]>(`/bookings/guest/${guestId}`);
    return response.map(transformBooking);
  },

  async getHostBookings(hostId: string): Promise<Booking[]> {
    const response = await apiRequest<any[]>(`/bookings/host/${hostId}`);
    return response.map(transformBooking);
  },

  async updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "completed",
    cancellationReason?: string,
  ): Promise<Booking> {
    const response = await apiRequest<any>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, cancellationReason }),
    });
    return transformBooking(response);
  },

  async updatePaymentStatus(
    id: string,
    paymentStatus: "pending" | "paid" | "refunded",
  ): Promise<Booking> {
    const response = await apiRequest<any>(`/bookings/${id}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus }),
    });
    return transformBooking(response);
  },

  async checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<boolean> {
    const response = await apiRequest<{ available: boolean }>(
      `/bookings/availability?propertyId=${propertyId}&checkIn=${checkIn}&checkOut=${checkOut}`,
    );
    return response.available;
  },

  async getUpcomingBookings(userId: string, isHost: boolean = false): Promise<Booking[]> {
    const bookings = isHost ? await this.getHostBookings(userId) : await this.getGuestBookings(userId);
    const today = new Date().toISOString().split("T")[0];
    return bookings.filter((booking) => booking.checkIn >= today && ["pending", "confirmed"].includes(booking.status));
  },

  async getPastBookings(userId: string, isHost: boolean = false): Promise<Booking[]> {
    const bookings = isHost ? await this.getHostBookings(userId) : await this.getGuestBookings(userId);
    const today = new Date().toISOString().split("T")[0];
    return bookings.filter((booking) => booking.checkOut < today);
  },

  async cancelBooking(id: string, reason: string): Promise<Booking> {
    return this.updateBookingStatus(id, "cancelled", reason);
  },

  async getBookingAnalytics(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    statusBreakdown: Record<string, number>;
    dailyBookings: Array<{ date: string; count: number; revenue: number }>;
  }> {
    return {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      statusBreakdown: {},
      dailyBookings: [],
    };
  },
};
