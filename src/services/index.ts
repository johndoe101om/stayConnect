// Export all services for easy importing
export { propertyService } from "./propertyService";
export { bookingService } from "./bookingService";
export { reviewService } from "./reviewService";
export { userService } from "./userService";
export { searchService } from "./searchService";
export { messageService } from "./messageService";
export { paymentService } from "./paymentService";
export { wishlistService } from "./wishlistService";
export { adminService } from "./adminService";
export {
  analyticsService,
  trackingUtils,
  EVENT_TYPES,
} from "./analyticsService";

// Re-export types for convenience
export type { SearchResult, SearchSuggestion } from "./searchService";
export type { Conversation } from "./messageService";
export type { Payment, PaymentIntent, RefundRequest } from "./paymentService";
export type { Wishlist } from "./wishlistService";
export type { AdminDashboardStats, AdminUser } from "./adminService";
export type { AnalyticsEvent, TrackingData } from "./analyticsService";
