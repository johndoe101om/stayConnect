import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Property, SearchFilters } from "../lib/types";
import { propertyService } from "./propertyService";

export interface SearchResult {
  properties: Property[];
  total: number;
  filters: {
    priceRange: [number, number];
    propertyTypes: Array<{ type: string; count: number }>;
    amenities: Array<{ amenity: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  };
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "city" | "property" | "amenity";
  count?: number;
}

export const searchService = {
  // Main search function with advanced filtering
  async searchProperties(
    query?: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20,
    sortBy:
      | "relevance"
      | "price_low"
      | "price_high"
      | "rating"
      | "newest" = "relevance",
  ): Promise<SearchResult> {
    try {
      let supabaseQuery = supabase
        .from("properties")
        .select(
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
        )
        .eq("is_active", true);

      // Apply text search
      if (query?.trim()) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,country.ilike.%${query}%`,
        );
      }

      // Apply location filter
      if (filters?.location?.trim()) {
        supabaseQuery = supabaseQuery.or(
          `city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,country.ilike.%${filters.location}%`,
        );
      }

      // Apply guest capacity filter
      if (filters?.guests) {
        supabaseQuery = supabaseQuery.gte("guests", filters.guests);
      }

      // Apply price range filter
      if (filters?.priceRange) {
        supabaseQuery = supabaseQuery
          .gte("base_price", filters.priceRange[0] * 100)
          .lte("base_price", filters.priceRange[1] * 100);
      }

      // Apply property types filter
      if (filters?.propertyTypes?.length) {
        supabaseQuery = supabaseQuery.in("type", filters.propertyTypes);
      }

      // Apply amenities filter
      if (filters?.amenities?.length) {
        supabaseQuery = supabaseQuery.contains("amenities", filters.amenities);
      }

      // Apply instant book filter
      if (filters?.instantBook) {
        supabaseQuery = supabaseQuery.eq("instant_book", true);
      }

      // Apply minimum rating filter
      if (filters?.minRating) {
        supabaseQuery = supabaseQuery.gte("rating", filters.minRating);
      }

      // Apply date availability filter
      if (filters?.checkIn && filters?.checkOut) {
        // This is a simplified version - in production, you'd want a more complex query
        // that checks against the bookings table
        const { data: unavailableProperties } = await supabase
          .from("bookings")
          .select("property_id")
          .in("status", ["confirmed", "pending"])
          .or(
            `and(check_in.lte.${filters.checkOut},check_out.gte.${filters.checkIn})`,
          );

        const unavailableIds =
          unavailableProperties?.map((b) => b.property_id) || [];
        if (unavailableIds.length > 0) {
          supabaseQuery = supabaseQuery.not(
            "id",
            "in",
            `(${unavailableIds.join(",")})`,
          );
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "price_low":
          supabaseQuery = supabaseQuery.order("base_price", {
            ascending: true,
          });
          break;
        case "price_high":
          supabaseQuery = supabaseQuery.order("base_price", {
            ascending: false,
          });
          break;
        case "rating":
          supabaseQuery = supabaseQuery.order("rating", {
            ascending: false,
            nullsLast: true,
          });
          break;
        case "newest":
          supabaseQuery = supabaseQuery.order("created_at", {
            ascending: false,
          });
          break;
        default: // relevance
          if (query?.trim()) {
            // Simple relevance scoring based on title match
            supabaseQuery = supabaseQuery.order("rating", {
              ascending: false,
              nullsLast: true,
            });
          } else {
            supabaseQuery = supabaseQuery.order("rating", {
              ascending: false,
              nullsLast: true,
            });
          }
      }

      // Get total count
      const { count } = await supabaseQuery.select("*", {
        count: "exact",
        head: true,
      });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabaseQuery.range(from, to);

      if (error) throw error;

      const properties =
        data?.map((property) =>
          propertyService.transformPropertyFromDB(property, property.users),
        ) || [];

      // Get filter aggregations
      const searchFilters = await this.getSearchFilters(query, filters);

      return {
        properties,
        total: count || 0,
        filters: searchFilters,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get search suggestions for autocomplete
  async getSearchSuggestions(
    query: string,
    limit = 10,
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      if (!query.trim()) return suggestions;

      // Get city suggestions
      const { data: cities } = await supabase
        .from("properties")
        .select("city, state, country")
        .ilike("city", `%${query}%`)
        .eq("is_active", true)
        .limit(5);

      if (cities) {
        const uniqueCities = Array.from(
          new Set(cities.map((p) => `${p.city}, ${p.state}, ${p.country}`)),
        );

        suggestions.push(
          ...uniqueCities.slice(0, 3).map((city) => ({
            id: `city_${city}`,
            text: city,
            type: "city" as const,
          })),
        );
      }

      // Get property title suggestions
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title")
        .ilike("title", `%${query}%`)
        .eq("is_active", true)
        .limit(5);

      if (properties) {
        suggestions.push(
          ...properties.slice(0, 3).map((property) => ({
            id: `property_${property.id}`,
            text: property.title,
            type: "property" as const,
          })),
        );
      }

      // Get amenity suggestions
      const commonAmenities = [
        "WiFi",
        "Kitchen",
        "Air conditioning",
        "TV",
        "Pool",
        "Gym",
        "Parking",
        "Pet friendly",
        "Fireplace",
        "Hot tub",
        "Balcony",
        "Garden",
      ];

      const matchingAmenities = commonAmenities.filter((amenity) =>
        amenity.toLowerCase().includes(query.toLowerCase()),
      );

      suggestions.push(
        ...matchingAmenities.slice(0, 2).map((amenity) => ({
          id: `amenity_${amenity}`,
          text: amenity,
          type: "amenity" as const,
        })),
      );

      return suggestions.slice(0, limit);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get available filters for current search
  async getSearchFilters(
    query?: string,
    currentFilters?: SearchFilters,
  ): Promise<{
    priceRange: [number, number];
    propertyTypes: Array<{ type: string; count: number }>;
    amenities: Array<{ amenity: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  }> {
    try {
      let baseQuery = supabase
        .from("properties")
        .select("base_price, type, amenities, city, state, country")
        .eq("is_active", true);

      // Apply existing search query but not the filters we're aggregating
      if (query?.trim()) {
        baseQuery = baseQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`,
        );
      }

      if (currentFilters?.location?.trim()) {
        baseQuery = baseQuery.or(
          `city.ilike.%${currentFilters.location}%,state.ilike.%${currentFilters.location}%`,
        );
      }

      const { data: properties, error } = await baseQuery;

      if (error) throw error;

      if (!properties || properties.length === 0) {
        return {
          priceRange: [0, 1000],
          propertyTypes: [],
          amenities: [],
          cities: [],
        };
      }

      // Calculate price range
      const prices = properties.map((p) => p.base_price / 100);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));

      // Count property types
      const typeCount = properties.reduce(
        (acc, property) => {
          acc[property.type] = (acc[property.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const propertyTypes = Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
      }));

      // Count amenities
      const amenityCount = properties.reduce(
        (acc, property) => {
          if (property.amenities) {
            property.amenities.forEach((amenity: string) => {
              acc[amenity] = (acc[amenity] || 0) + 1;
            });
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const amenities = Object.entries(amenityCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([amenity, count]) => ({ amenity, count }));

      // Count cities
      const cityCount = properties.reduce(
        (acc, property) => {
          const cityKey = `${property.city}, ${property.state}`;
          acc[cityKey] = (acc[cityKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const cities = Object.entries(cityCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      return {
        priceRange: [minPrice, maxPrice],
        propertyTypes,
        amenities,
        cities,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get trending searches
  async getTrendingSearches(
    limit = 10,
  ): Promise<Array<{ query: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_data")
        .eq("event_type", "search")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(1000);

      if (error) throw error;

      const searchCounts =
        data?.reduce(
          (acc, event) => {
            const query = event.event_data?.query;
            if (query && typeof query === "string" && query.trim()) {
              acc[query.toLowerCase()] = (acc[query.toLowerCase()] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      return Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      console.error("Error getting trending searches:", error);
      return [];
    }
  },

  // Save search analytics
  async trackSearch(
    userId: string | null,
    query: string,
    filters?: SearchFilters,
    resultCount?: number,
  ): Promise<void> {
    try {
      await supabase.from("analytics_events").insert([
        {
          user_id: userId,
          event_type: "search",
          event_data: {
            query: query.trim(),
            filters,
            result_count: resultCount,
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (error) {
      // Don't throw error for analytics tracking
      console.error("Error tracking search:", error);
    }
  },

  // Get popular destinations
  async getPopularDestinations(limit = 8): Promise<
    Array<{
      city: string;
      state: string;
      country: string;
      propertyCount: number;
      averagePrice: number;
      imageUrl?: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("city, state, country, base_price, images")
        .eq("is_active", true);

      if (error) throw error;

      const destinationStats =
        data?.reduce(
          (acc, property) => {
            const key = `${property.city}, ${property.state}, ${property.country}`;
            if (!acc[key]) {
              acc[key] = {
                city: property.city,
                state: property.state,
                country: property.country,
                propertyCount: 0,
                totalPrice: 0,
                images: [],
              };
            }
            acc[key].propertyCount++;
            acc[key].totalPrice += property.base_price;
            if (property.images && property.images.length > 0) {
              acc[key].images.push(property.images[0]);
            }
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      return Object.values(destinationStats)
        .map((dest: any) => ({
          city: dest.city,
          state: dest.state,
          country: dest.country,
          propertyCount: dest.propertyCount,
          averagePrice: Math.round(dest.totalPrice / dest.propertyCount / 100),
          imageUrl: dest.images[0],
        }))
        .sort((a, b) => b.propertyCount - a.propertyCount)
        .slice(0, limit);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get nearby properties based on coordinates
  async getNearbyProperties(
    latitude: number,
    longitude: number,
    radiusKm = 25,
    limit = 20,
  ): Promise<Property[]> {
    try {
      // This is a simplified version using bounding box
      // In production, you'd want to use PostGIS for accurate distance calculations
      const latDelta = radiusKm / 111; // Rough conversion
      const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

      const { data, error } = await supabase
        .from("properties")
        .select(
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
        )
        .eq("is_active", true)
        .gte("latitude", latitude - latDelta)
        .lte("latitude", latitude + latDelta)
        .gte("longitude", longitude - lonDelta)
        .lte("longitude", longitude + lonDelta)
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((property) =>
          propertyService.transformPropertyFromDB(property, property.users),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
