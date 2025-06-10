import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Review } from "../lib/types";
import type { Database } from "../lib/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Transform database row to frontend Review type
const transformReviewFromDB = (review: ReviewRow, reviewer?: any): Review => ({
  id: review.id,
  bookingId: review.booking_id,
  propertyId: review.property_id,
  reviewerId: review.reviewer_id,
  rating: review.rating,
  comment: review.comment,
  type: review.type,
  createdAt: review.created_at,
  reviewer: reviewer || { id: review.reviewer_id },
});

export const reviewService = {
  // Create new review
  async createReview(reviewData: {
    bookingId: string;
    propertyId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string;
    type: "guest-to-host" | "host-to-guest";
    accuracyRating?: number;
    communicationRating?: number;
    cleanlinessRating?: number;
    locationRating?: number;
    checkinRating?: number;
    valueRating?: number;
  }): Promise<Review> {
    try {
      // Check if review already exists for this booking and type
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", reviewData.bookingId)
        .eq("reviewer_id", reviewData.reviewerId)
        .eq("type", reviewData.type)
        .single();

      if (existing) {
        throw new Error("Review already exists for this booking");
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            booking_id: reviewData.bookingId,
            property_id: reviewData.propertyId,
            reviewer_id: reviewData.reviewerId,
            reviewee_id: reviewData.revieweeId,
            rating: reviewData.rating,
            comment: reviewData.comment,
            type: reviewData.type,
            accuracy_rating: reviewData.accuracyRating,
            communication_rating: reviewData.communicationRating,
            cleanliness_rating: reviewData.cleanlinessRating,
            location_rating: reviewData.locationRating,
            checkin_rating: reviewData.checkinRating,
            value_rating: reviewData.valueRating,
            helpful_count: 0,
          },
        ])
        .select(
          `
          *,
          reviewer:reviewer_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .single();

      if (error) throw error;

      // Update property or user rating after review creation
      if (reviewData.type === "guest-to-host") {
        await this.updatePropertyRating(reviewData.propertyId);
      } else {
        await this.updateUserRating(reviewData.revieweeId);
      }

      return transformReviewFromDB(data, data.reviewer);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get reviews for a property
  async getPropertyReviews(
    propertyId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    reviews: Review[];
    total: number;
    averageRating: number;
    ratingBreakdown: Record<number, number>;
  }> {
    try {
      // Get total count and average rating
      const { data: allReviews, error: allError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("property_id", propertyId)
        .eq("type", "guest-to-host");

      if (allError) throw allError;

      const total = allReviews?.length || 0;
      const averageRating =
        total > 0
          ? allReviews.reduce((sum, review) => sum + review.rating, 0) / total
          : 0;

      // Rating breakdown
      const ratingBreakdown =
        allReviews?.reduce(
          (acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        ) || {};

      // Get paginated reviews with reviewer details
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:reviewer_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .eq("property_id", propertyId)
        .eq("type", "guest-to-host")
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviews =
        data?.map((review) => transformReviewFromDB(review, review.reviewer)) ||
        [];

      return {
        reviews,
        total,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get reviews by user (as reviewer)
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          properties:property_id (title, images),
          reviewee:reviewee_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .eq("reviewer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((review) => transformReviewFromDB(review, { id: userId })) ||
        []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get reviews about a user (as reviewee)
  async getReviewsAboutUser(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:reviewer_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((review) => transformReviewFromDB(review, review.reviewer)) ||
        []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get review by booking ID and type
  async getReviewByBooking(
    bookingId: string,
    type: "guest-to-host" | "host-to-guest",
  ): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:reviewer_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .eq("booking_id", bookingId)
        .eq("type", type)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data ? transformReviewFromDB(data, data.reviewer) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update review
  async updateReview(
    id: string,
    updateData: {
      rating?: number;
      comment?: string;
      accuracyRating?: number;
      communicationRating?: number;
      cleanlinessRating?: number;
      locationRating?: number;
      checkinRating?: number;
      valueRating?: number;
    },
  ): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          ...updateData,
          accuracy_rating: updateData.accuracyRating,
          communication_rating: updateData.communicationRating,
          cleanliness_rating: updateData.cleanlinessRating,
          location_rating: updateData.locationRating,
          checkin_rating: updateData.checkinRating,
          value_rating: updateData.valueRating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          *,
          reviewer:reviewer_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .single();

      if (error) throw error;

      return transformReviewFromDB(data, data.reviewer);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Mark review as helpful
  async markReviewHelpful(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("increment_review_helpful", {
        review_id: id,
      });

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete review
  async deleteReview(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update property rating based on reviews
  async updatePropertyRating(propertyId: string): Promise<void> {
    try {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("property_id", propertyId)
        .eq("type", "guest-to-host");

      if (error) throw error;

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length;

        await supabase
          .from("properties")
          .update({
            rating: Math.round(avgRating * 10) / 10,
            review_count: reviews.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", propertyId);
      }
    } catch (error) {
      console.error("Error updating property rating:", error);
    }
  },

  // Update user rating based on reviews
  async updateUserRating(userId: string): Promise<void> {
    try {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId);

      if (error) throw error;

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length;

        await supabase
          .from("users")
          .update({
            rating: Math.round(avgRating * 10) / 10,
            review_count: reviews.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    } catch (error) {
      console.error("Error updating user rating:", error);
    }
  },

  // Get review statistics for admin dashboard
  async getReviewStatistics(): Promise<{
    totalReviews: number;
    averageRating: number;
    reviewsToday: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const { data: allReviews, error } = await supabase
        .from("reviews")
        .select("rating, created_at");

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      const totalReviews = allReviews?.length || 0;
      const reviewsToday =
        allReviews?.filter((review) => review.created_at.startsWith(today))
          .length || 0;

      const averageRating =
        totalReviews > 0
          ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      const ratingDistribution =
        allReviews?.reduce(
          (acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        ) || {};

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewsToday,
        ratingDistribution,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
