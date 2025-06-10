import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Property, SearchFilters, ListingFormData } from "../lib/types";
import type { Database } from "../lib/database.types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// Transform database row to frontend Property type
const transformPropertyFromDB = (
  property: PropertyRow,
  host?: any,
): Property => ({
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
  host: host || { id: property.host_id },
  createdAt: property.created_at,
  updatedAt: property.updated_at,
});

// Transform frontend Property type to database insert
const transformPropertyToDB = (
  data: ListingFormData,
  hostId: string,
): PropertyInsert => ({
  host_id: hostId,
  title: data.title,
  description: data.description,
  type: data.type,
  address: data.location.address,
  city: data.location.city,
  state: data.location.state,
  country: data.location.country,
  latitude: data.location.latitude,
  longitude: data.location.longitude,
  base_price: data.pricing.basePrice,
  cleaning_fee: data.pricing.cleaningFee,
  service_fee: data.pricing.serviceFee,
  currency: data.pricing.currency,
  guests: data.capacity.guests,
  bedrooms: data.capacity.bedrooms,
  beds: data.capacity.beds,
  bathrooms: data.capacity.bathrooms,
  amenities: data.amenities,
  images: data.images,
  min_stay: data.availability.minStay,
  max_stay: data.availability.maxStay,
  instant_book: data.availability.instantBook,
  rules: data.rules,
  is_active: true,
});

export const propertyService = {
  // Get all properties with pagination and filters
  async getProperties(
    filters?: SearchFilters,
    page = 1,
    limit = 20,
  ): Promise<{ properties: Property[]; total: number }> {
    try {
      let query = supabase
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
        .eq("is_active", true);

      // Apply filters
      if (filters?.location) {
        query = query.or(
          `city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,country.ilike.%${filters.location}%`,
        );
      }

      if (filters?.guests) {
        query = query.gte("guests", filters.guests);
      }

      if (filters?.priceRange) {
        query = query
          .gte("base_price", filters.priceRange[0] * 100)
          .lte("base_price", filters.priceRange[1] * 100);
      }

      if (filters?.propertyTypes?.length) {
        query = query.in("type", filters.propertyTypes);
      }

      if (filters?.amenities?.length) {
        query = query.contains("amenities", filters.amenities);
      }

      if (filters?.instantBook) {
        query = query.eq("instant_book", true);
      }

      if (filters?.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      // Get total count
      const { count } = await query.select("*", { count: "exact", head: true });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const properties =
        data?.map((property) =>
          transformPropertyFromDB(property, property.users),
        ) || [];

      return { properties, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get property by ID
  async getPropertyById(id: string): Promise<Property | null> {
    try {
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
            phone,
            rating,
            review_count,
            is_verified,
            bio,
            languages,
            response_rate,
            response_time,
            joined_date
          )
        `,
        )
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data ? transformPropertyFromDB(data, data.users) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get properties by host ID
  async getPropertiesByHost(hostId: string): Promise<Property[]> {
    try {
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
        .eq("host_id", hostId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((property) =>
          transformPropertyFromDB(property, property.users),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create new property
  async createProperty(
    data: ListingFormData,
    hostId: string,
  ): Promise<Property> {
    try {
      const propertyData = transformPropertyToDB(data, hostId);

      const { data: createdProperty, error } = await supabase
        .from("properties")
        .insert([propertyData])
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
        .single();

      if (error) throw error;

      return transformPropertyFromDB(createdProperty, createdProperty.users);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update property
  async updateProperty(
    id: string,
    data: Partial<ListingFormData>,
  ): Promise<Property> {
    try {
      const updateData: PropertyUpdate = {};

      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.type) updateData.type = data.type;
      if (data.location) {
        updateData.address = data.location.address;
        updateData.city = data.location.city;
        updateData.state = data.location.state;
        updateData.country = data.location.country;
        updateData.latitude = data.location.latitude;
        updateData.longitude = data.location.longitude;
      }
      if (data.pricing) {
        updateData.base_price = data.pricing.basePrice;
        updateData.cleaning_fee = data.pricing.cleaningFee;
        updateData.service_fee = data.pricing.serviceFee;
        updateData.currency = data.pricing.currency;
      }
      if (data.capacity) {
        updateData.guests = data.capacity.guests;
        updateData.bedrooms = data.capacity.bedrooms;
        updateData.beds = data.capacity.beds;
        updateData.bathrooms = data.capacity.bathrooms;
      }
      if (data.amenities) updateData.amenities = data.amenities;
      if (data.images) updateData.images = data.images;
      if (data.availability) {
        updateData.min_stay = data.availability.minStay;
        updateData.max_stay = data.availability.maxStay;
        updateData.instant_book = data.availability.instantBook;
      }
      if (data.rules) updateData.rules = data.rules;

      updateData.updated_at = new Date().toISOString();

      const { data: updatedProperty, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
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
        .single();

      if (error) throw error;

      return transformPropertyFromDB(updatedProperty, updatedProperty.users);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete property (soft delete)
  async deleteProperty(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Search properties with advanced filters
  async searchProperties(
    query: string,
    filters?: SearchFilters,
  ): Promise<Property[]> {
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
        )
        .eq("is_active", true);

      // Text search across multiple fields
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`,
        );
      }

      // Apply additional filters similar to getProperties
      if (filters?.guests) {
        supabaseQuery = supabaseQuery.gte("guests", filters.guests);
      }

      if (filters?.priceRange) {
        supabaseQuery = supabaseQuery
          .gte("base_price", filters.priceRange[0] * 100)
          .lte("base_price", filters.priceRange[1] * 100);
      }

      if (filters?.propertyTypes?.length) {
        supabaseQuery = supabaseQuery.in("type", filters.propertyTypes);
      }

      if (filters?.amenities?.length) {
        supabaseQuery = supabaseQuery.contains("amenities", filters.amenities);
      }

      if (filters?.instantBook) {
        supabaseQuery = supabaseQuery.eq("instant_book", true);
      }

      if (filters?.minRating) {
        supabaseQuery = supabaseQuery.gte("rating", filters.minRating);
      }

      const { data, error } = await supabaseQuery
        .order("rating", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (
        data?.map((property) =>
          transformPropertyFromDB(property, property.users),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get property availability for date range
  async getPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"])
        .or(`check_in.lte.${endDate},check_out.gte.${startDate}`)
        .limit(1);

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update property rating after review
  async updatePropertyRating(propertyId: string): Promise<void> {
    try {
      // Calculate average rating from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("property_id", propertyId)
        .eq("type", "guest-to-host");

      if (reviewsError) throw reviewsError;

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length;

        const { error: updateError } = await supabase
          .from("properties")
          .update({
            rating: Math.round(avgRating * 10) / 10,
            review_count: reviews.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", propertyId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
