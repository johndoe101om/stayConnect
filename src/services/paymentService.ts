import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

// Transform database row to frontend Payment type
const transformPaymentFromDB = (payment: PaymentRow): Payment => ({
  id: payment.id,
  bookingId: payment.booking_id,
  amount: payment.amount,
  currency: payment.currency,
  paymentMethod: payment.payment_method,
  paymentStatus: payment.payment_status,
  stripePaymentIntentId: payment.stripe_payment_intent_id || undefined,
  refundAmount: payment.refund_amount || undefined,
  refundReason: payment.refund_reason || undefined,
  createdAt: payment.created_at,
  updatedAt: payment.updated_at,
});

export const paymentService = {
  // Create payment intent for booking
  async createPaymentIntent(bookingData: {
    bookingId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    description?: string;
  }): Promise<PaymentIntent> {
    try {
      // In a real implementation, you would call Stripe API here
      // For now, we'll simulate the response
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

      // Store payment record in database
      const { data, error } = await supabase
        .from("payments")
        .insert([
          {
            booking_id: bookingData.bookingId,
            amount: bookingData.amount,
            currency: bookingData.currency || "INR",
            payment_method: bookingData.paymentMethod,
            payment_status: "pending",
            stripe_payment_intent_id: paymentIntentId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: paymentIntentId,
        clientSecret,
        amount: bookingData.amount,
        currency: bookingData.currency || "INR",
        status: "requires_payment_method",
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    try {
      // In a real implementation, you would verify with Stripe
      const { data, error } = await supabase
        .from("payments")
        .update({
          payment_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntentId)
        .select()
        .single();

      if (error) throw error;

      // Update booking payment status
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.booking_id);

      return transformPaymentFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data ? transformPaymentFromDB(data) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get payment by booking ID
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data ? transformPaymentFromDB(data) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Process refund
  async processRefund(
    paymentId: string,
    refundData: RefundRequest,
  ): Promise<Payment> {
    try {
      // In a real implementation, you would call Stripe API to process refund
      const { data, error } = await supabase
        .from("payments")
        .update({
          payment_status: "refunded",
          refund_amount: refundData.amount,
          refund_reason: refundData.reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      // Update booking payment status
      await supabase
        .from("bookings")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.booking_id);

      return transformPaymentFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user's payment history
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          bookings!inner (guest_id, property_id, properties (title))
        `,
        )
        .eq("bookings.guest_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data?.map((payment) => transformPaymentFromDB(payment)) || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get host's earnings
  async getHostEarnings(
    hostId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    payments: Payment[];
    totalEarnings: number;
    pendingEarnings: number;
    refundedAmount: number;
  }> {
    try {
      let query = supabase
        .from("payments")
        .select(
          `
          *,
          bookings!inner (host_id, property_id, properties (title))
        `,
        )
        .eq("bookings.host_id", hostId);

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      const payments =
        data?.map((payment) => transformPaymentFromDB(payment)) || [];

      const totalEarnings = payments
        .filter((p) => p.paymentStatus === "completed")
        .reduce((sum, payment) => sum + payment.amount, 0);

      const pendingEarnings = payments
        .filter((p) => p.paymentStatus === "pending")
        .reduce((sum, payment) => sum + payment.amount, 0);

      const refundedAmount = payments
        .filter((p) => p.paymentStatus === "refunded")
        .reduce((sum, payment) => sum + (payment.refundAmount || 0), 0);

      return {
        payments,
        totalEarnings,
        pendingEarnings,
        refundedAmount,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Calculate pricing breakdown
  calculatePricingBreakdown(
    basePrice: number,
    nights: number,
    cleaningFee: number = 0,
    serviceFee: number = 0,
    taxes: number = 0,
  ): {
    subtotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    total: number;
  } {
    const subtotal = basePrice * nights;
    const totalTaxes = Math.round(subtotal * (taxes / 100));
    const total = subtotal + cleaningFee + serviceFee + totalTaxes;

    return {
      subtotal,
      cleaningFee,
      serviceFee,
      taxes: totalTaxes,
      total,
    };
  },

  // Get payment statistics for admin
  async getPaymentStatistics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    refundRate: number;
    paymentMethodBreakdown: Record<string, number>;
    dailyRevenue: Array<{
      date: string;
      revenue: number;
      transactions: number;
    }>;
  }> {
    try {
      let query = supabase.from("payments").select("*");

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      const completedPayments =
        payments?.filter((p) => p.payment_status === "completed") || [];
      const refundedPayments =
        payments?.filter((p) => p.payment_status === "refunded") || [];

      const totalRevenue = completedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const totalTransactions = completedPayments.length;
      const averageTransactionValue =
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const refundRate = payments?.length
        ? (refundedPayments.length / payments.length) * 100
        : 0;

      // Payment method breakdown
      const paymentMethodBreakdown = completedPayments.reduce(
        (acc, payment) => {
          acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Daily revenue
      const dailyRevenue = completedPayments.reduce(
        (acc, payment) => {
          const date = payment.created_at.split("T")[0];
          const existing = acc.find((item) => item.date === date);
          if (existing) {
            existing.revenue += payment.amount;
            existing.transactions++;
          } else {
            acc.push({ date, revenue: payment.amount, transactions: 1 });
          }
          return acc;
        },
        [] as Array<{ date: string; revenue: number; transactions: number }>,
      );

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue,
        refundRate,
        paymentMethodBreakdown,
        dailyRevenue: dailyRevenue.sort((a, b) => a.date.localeCompare(b.date)),
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Retry failed payment
  async retryPayment(paymentId: string): Promise<PaymentIntent> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.paymentStatus !== "failed") {
        throw new Error("Payment is not in failed status");
      }

      // Create new payment intent
      const newPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = `${newPaymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

      // Update payment record
      await supabase
        .from("payments")
        .update({
          stripe_payment_intent_id: newPaymentIntentId,
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      return {
        id: newPaymentIntentId,
        clientSecret,
        amount: payment.amount,
        currency: payment.currency,
        status: "requires_payment_method",
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Mark payment as failed
  async markPaymentFailed(
    paymentIntentId: string,
    reason?: string,
  ): Promise<void> {
    try {
      await supabase
        .from("payments")
        .update({
          payment_status: "failed",
          refund_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntentId);

      // Update booking status
      const { data: payment } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (payment) {
        await supabase
          .from("bookings")
          .update({
            payment_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.booking_id);
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
