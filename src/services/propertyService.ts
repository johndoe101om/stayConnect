import { apiRequest } from "../lib/apiClient";
import type { Property, SearchFilters, ListingFormData } from "../lib/types";

type BackendProperty = any;

const transformProperty = (property: BackendProperty): Property => ({
  id: property.id,
  hostId: property.hostId,
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
    basePrice: property.basePrice,
    cleaningFee: property.cleaningFee || 0,
    serviceFee: property.serviceFee || 0,
    currency: property.currency || "INR",
  },
  capacity: {
    guests: property.guests || 1,
    bedrooms: property.bedrooms || 1,
    beds: property.beds || 1,
    bathrooms: property.bathrooms || 1,
  },
  amenities: property.amenities || [],
  images: property.images || [],
  availability: {
    minStay: property.minStay || 1,
    maxStay: property.maxStay || 30,
    instantBook: Boolean(property.instantBook),
  },
  rules: property.rules || [],
  rating: property.rating || 0,
  reviewCount: property.reviewCount || 0,
  host: property.host || { id: property.hostId },
  createdAt: property.createdAtUtc || property.createdAt || new Date().toISOString(),
  updatedAt: property.updatedAtUtc || property.updatedAt || new Date().toISOString(),
});

const buildQueryString = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const propertyService = {
  async getProperties(
    filters?: SearchFilters,
    page = 1,
    limit = 20,
  ): Promise<{ properties: Property[]; total: number }> {
    const query = buildQueryString({
      location: filters?.location,
      guests: filters?.guests,
      minPrice: filters?.priceRange?.[0],
      maxPrice: filters?.priceRange?.[1],
      propertyTypes: filters?.propertyTypes,
      amenities: filters?.amenities,
      instantBook: filters?.instantBook,
      minRating: filters?.minRating,
      page,
      limit,
    });

    const response = await apiRequest<{ properties: BackendProperty[]; total: number }>(`/properties${query}`);
    return {
      properties: response.properties.map(transformProperty),
      total: response.total,
    };
  },

  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    const response = await apiRequest<BackendProperty[]>(`/properties/featured?limit=${limit}`);
    return response.map(transformProperty);
  },

  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const response = await apiRequest<BackendProperty>(`/properties/${id}`);
      return transformProperty(response);
    } catch (error: any) {
      if (String(error.message).includes("404")) return null;
      throw error;
    }
  },

  async getPropertiesByHost(hostId: string): Promise<Property[]> {
    const response = await apiRequest<BackendProperty[]>(`/properties/host/${hostId}`);
    return response.map(transformProperty);
  },

  async createProperty(data: ListingFormData, _hostId: string): Promise<Property> {
    const response = await apiRequest<BackendProperty>("/properties", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return transformProperty(response);
  },

  async updateProperty(id: string, data: Partial<ListingFormData>): Promise<Property> {
    const response = await apiRequest<BackendProperty>(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return transformProperty(response);
  },

  async deleteProperty(id: string): Promise<boolean> {
    await apiRequest<void>(`/properties/${id}`, { method: "DELETE" });
    return true;
  },

  async searchProperties(query: string, filters?: SearchFilters): Promise<Property[]> {
    const response = await this.getProperties({ ...filters, location: query }, 1, 50);
    return response.properties;
  },

  async getPropertyAvailability(propertyId: string, startDate: string, endDate: string): Promise<boolean> {
    const response = await apiRequest<{ available: boolean }>(
      `/bookings/availability?propertyId=${propertyId}&checkIn=${startDate}&checkOut=${endDate}`,
    );
    return response.available;
  },

  async updatePropertyRating(_propertyId: string): Promise<void> {
    return Promise.resolve();
  },
};
