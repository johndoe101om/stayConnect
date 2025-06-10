import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type AnalyticsEventRow =
  Database["public"]["Tables"]["analytics_events"]["Row"];
type AnalyticsEventInsert =
  Database["public"]["Tables"]["analytics_events"]["Insert"];

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: string;
  eventData: any;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface TrackingData {
  eventType: string;
  eventData?: any;
  userId?: string;
  pageUrl?: string;
  referrer?: string;
}

// Common event types
export const EVENT_TYPES = {
  // User events
  USER_SIGNUP: "user_signup",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  PROFILE_UPDATE: "profile_update",

  // Property events
  PROPERTY_VIEW: "property_view",
  PROPERTY_LIKE: "property_like",
  PROPERTY_SHARE: "property_share",
  PROPERTY_CREATE: "property_create",
  PROPERTY_UPDATE: "property_update",

  // Search events
  SEARCH_PERFORMED: "search_performed",
  FILTER_APPLIED: "filter_applied",
  SEARCH_RESULT_CLICK: "search_result_click",

  // Booking events
  BOOKING_INITIATED: "booking_initiated",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_ATTEMPTED: "payment_attempted",
  PAYMENT_COMPLETED: "payment_completed",

  // Review events
  REVIEW_SUBMITTED: "review_submitted",
  REVIEW_HELPFUL: "review_helpful",

  // Wishlist events
  WISHLIST_ADD: "wishlist_add",
  WISHLIST_REMOVE: "wishlist_remove",

  // Message events
  MESSAGE_SENT: "message_sent",
  CONVERSATION_STARTED: "conversation_started",

  // Navigation events
  PAGE_VIEW: "page_view",
  BUTTON_CLICK: "button_click",
  LINK_CLICK: "link_click",

  // Error events
  ERROR_OCCURRED: "error_occurred",
  API_ERROR: "api_error",
} as const;

export const analyticsService = {
  // Track a single event
  async trackEvent(data: TrackingData): Promise<void> {
    try {
      // Get browser information
      const userAgent =
        typeof window !== "undefined" ? window.navigator.userAgent : undefined;
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : data.pageUrl;
      const referrer =
        typeof window !== "undefined" ? document.referrer : data.referrer;

      const eventData: AnalyticsEventInsert = {
        user_id: data.userId,
        event_type: data.eventType,
        event_data: data.eventData || {},
        page_url: pageUrl,
        referrer,
        user_agent: userAgent,
        // Note: IP address would typically be captured server-side
      };

      await supabase.from("analytics_events").insert([eventData]);
    } catch (error) {
      // Don't throw errors for analytics tracking to avoid breaking user experience
      console.error("Error tracking event:", error);
    }
  },

  // Track multiple events in batch
  async trackEvents(events: TrackingData[]): Promise<void> {
    try {
      const userAgent =
        typeof window !== "undefined" ? window.navigator.userAgent : undefined;
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : undefined;
      const referrer =
        typeof window !== "undefined" ? document.referrer : undefined;

      const eventData: AnalyticsEventInsert[] = events.map((event) => ({
        user_id: event.userId,
        event_type: event.eventType,
        event_data: event.eventData || {},
        page_url: event.pageUrl || pageUrl,
        referrer: event.referrer || referrer,
        user_agent: userAgent,
      }));

      await supabase.from("analytics_events").insert(eventData);
    } catch (error) {
      console.error("Error tracking events:", error);
    }
  },

  // Track page view
  async trackPageView(userId?: string, additionalData?: any): Promise<void> {
    if (typeof window === "undefined") return;

    await this.trackEvent({
      eventType: EVENT_TYPES.PAGE_VIEW,
      userId,
      eventData: {
        ...additionalData,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    });
  },

  // Track user interaction
  async trackInteraction(
    interactionType: string,
    elementId?: string,
    userId?: string,
    additionalData?: any,
  ): Promise<void> {
    await this.trackEvent({
      eventType: EVENT_TYPES.BUTTON_CLICK,
      userId,
      eventData: {
        interaction_type: interactionType,
        element_id: elementId,
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Track search
  async trackSearch(
    query: string,
    filters?: any,
    resultCount?: number,
    userId?: string,
  ): Promise<void> {
    await this.trackEvent({
      eventType: EVENT_TYPES.SEARCH_PERFORMED,
      userId,
      eventData: {
        query: query.trim(),
        filters,
        result_count: resultCount,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Track property view
  async trackPropertyView(
    propertyId: string,
    userId?: string,
    source?: string,
    additionalData?: any,
  ): Promise<void> {
    await this.trackEvent({
      eventType: EVENT_TYPES.PROPERTY_VIEW,
      userId,
      eventData: {
        property_id: propertyId,
        source,
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Track booking funnel
  async trackBookingStep(
    step: "initiated" | "details" | "payment" | "completed",
    bookingId: string,
    propertyId: string,
    userId?: string,
    additionalData?: any,
  ): Promise<void> {
    const eventTypeMap = {
      initiated: EVENT_TYPES.BOOKING_INITIATED,
      details: "booking_details_filled",
      payment: EVENT_TYPES.PAYMENT_ATTEMPTED,
      completed: EVENT_TYPES.BOOKING_COMPLETED,
    };

    await this.trackEvent({
      eventType: eventTypeMap[step],
      userId,
      eventData: {
        booking_id: bookingId,
        property_id: propertyId,
        step,
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Track error
  async trackError(
    error: Error,
    context?: string,
    userId?: string,
    additionalData?: any,
  ): Promise<void> {
    await this.trackEvent({
      eventType: EVENT_TYPES.ERROR_OCCURRED,
      userId,
      eventData: {
        error_message: error.message,
        error_stack: error.stack,
        context,
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Get analytics data for dashboard
  async getAnalytics(
    startDate: string,
    endDate: string,
    eventTypes?: string[],
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    dailyEvents: Array<{ date: string; count: number }>;
    topPages: Array<{ page: string; views: number }>;
    userEngagement: {
      uniqueUsers: number;
      returningUsers: number;
      avgSessionDuration: number;
    };
  }> {
    try {
      let query = supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (eventTypes && eventTypes.length > 0) {
        query = query.in("event_type", eventTypes);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      const totalEvents = events?.length || 0;

      // Events by type
      const eventsByType =
        events?.reduce(
          (acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      // Daily events
      const dailyEventsMap =
        events?.reduce(
          (acc, event) => {
            const date = event.created_at.split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const dailyEvents = Object.entries(dailyEventsMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top pages
      const pageViews =
        events?.filter((e) => e.event_type === EVENT_TYPES.PAGE_VIEW) || [];
      const pageViewsMap = pageViews.reduce(
        (acc, event) => {
          const page = event.page_url || "unknown";
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topPages = Object.entries(pageViewsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([page, views]) => ({ page, views }));

      // User engagement
      const uniqueUsers = new Set(events?.map((e) => e.user_id).filter(Boolean))
        .size;

      // Simple returning users calculation (users with events on different days)
      const userDays =
        events?.reduce(
          (acc, event) => {
            if (event.user_id) {
              const date = event.created_at.split("T")[0];
              if (!acc[event.user_id]) acc[event.user_id] = new Set();
              acc[event.user_id].add(date);
            }
            return acc;
          },
          {} as Record<string, Set<string>>,
        ) || {};

      const returningUsers = Object.values(userDays).filter(
        (days) => days.size > 1,
      ).length;

      return {
        totalEvents,
        eventsByType,
        dailyEvents,
        topPages,
        userEngagement: {
          uniqueUsers,
          returningUsers,
          avgSessionDuration: 0, // Would need more complex calculation
        },
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user journey
  async getUserJourney(userId: string, limit = 100): Promise<AnalyticsEvent[]> {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((event) => ({
          id: event.id,
          userId: event.user_id || undefined,
          eventType: event.event_type,
          eventData: event.event_data,
          pageUrl: event.page_url || undefined,
          referrer: event.referrer || undefined,
          userAgent: event.user_agent || undefined,
          ipAddress: event.ip_address || undefined,
          createdAt: event.created_at,
        })) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get conversion funnel
  async getConversionFunnel(
    funnelSteps: string[],
    startDate: string,
    endDate: string,
  ): Promise<Array<{ step: string; users: number; conversionRate: number }>> {
    try {
      const results = [];
      let previousUsers = 0;

      for (let i = 0; i < funnelSteps.length; i++) {
        const step = funnelSteps[i];

        const { data, error } = await supabase
          .from("analytics_events")
          .select("user_id")
          .eq("event_type", step)
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (error) throw error;

        const uniqueUsers = new Set(data?.map((e) => e.user_id).filter(Boolean))
          .size;
        const conversionRate =
          i === 0
            ? 100
            : previousUsers > 0
              ? (uniqueUsers / previousUsers) * 100
              : 0;

        results.push({
          step,
          users: uniqueUsers,
          conversionRate,
        });

        previousUsers = uniqueUsers;
      }

      return results;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<{
    activeUsers: number;
    currentPageViews: Array<{ page: string; count: number }>;
    recentEvents: AnalyticsEvent[];
  }> {
    try {
      const fifteenMinutesAgo = new Date(
        Date.now() - 15 * 60 * 1000,
      ).toISOString();

      // Active users (users with events in last 15 minutes)
      const { data: recentEvents, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", fifteenMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const activeUsers = new Set(
        recentEvents?.map((e) => e.user_id).filter(Boolean),
      ).size;

      // Current page views
      const pageViews =
        recentEvents?.filter((e) => e.event_type === EVENT_TYPES.PAGE_VIEW) ||
        [];
      const pageViewsMap = pageViews.reduce(
        (acc, event) => {
          const page = event.page_url || "unknown";
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const currentPageViews = Object.entries(pageViewsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      const formattedEvents =
        recentEvents?.slice(0, 20).map((event) => ({
          id: event.id,
          userId: event.user_id || undefined,
          eventType: event.event_type,
          eventData: event.event_data,
          pageUrl: event.page_url || undefined,
          referrer: event.referrer || undefined,
          userAgent: event.user_agent || undefined,
          ipAddress: event.ip_address || undefined,
          createdAt: event.created_at,
        })) || [];

      return {
        activeUsers,
        currentPageViews,
        recentEvents: formattedEvents,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Clean up old events (for data retention)
  async cleanupOldEvents(retentionDays = 365): Promise<number> {
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from("analytics_events")
        .delete()
        .lt("created_at", cutoffDate);

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};

// Utility functions for common tracking scenarios
export const trackingUtils = {
  // Auto-track page views
  initPageViewTracking(userId?: string) {
    if (typeof window === "undefined") return;

    // Track initial page view
    analyticsService.trackPageView(userId);

    // Track page changes in SPA
    let currentUrl = window.location.href;
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        analyticsService.trackPageView(userId);
      }
    };

    // Check for URL changes every 500ms
    const interval = setInterval(checkUrlChange, 500);

    // Return cleanup function
    return () => clearInterval(interval);
  },

  // Track clicks on elements with data-track attributes
  initClickTracking(userId?: string) {
    if (typeof window === "undefined") return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const trackData = target.dataset.track;

      if (trackData) {
        analyticsService.trackInteraction(
          "click",
          target.id || target.className,
          userId,
          { track_data: trackData },
        );
      }
    };

    document.addEventListener("click", handleClick);

    // Return cleanup function
    return () => document.removeEventListener("click", handleClick);
  },

  // Track form submissions
  trackFormSubmission(formId: string, userId?: string, additionalData?: any) {
    analyticsService.trackEvent({
      eventType: "form_submission",
      userId,
      eventData: {
        form_id: formId,
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Track external link clicks
  trackExternalLink(url: string, userId?: string) {
    analyticsService.trackEvent({
      eventType: EVENT_TYPES.LINK_CLICK,
      userId,
      eventData: {
        url,
        type: "external",
        timestamp: new Date().toISOString(),
      },
    });
  },
};
