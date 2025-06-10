import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Property } from "../lib/types";
import type { Database } from "../lib/database.types";
import { propertyService } from "./propertyService";

type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];
type WishlistInsert = Database["public"]["Tables"]["wishlists"]["Insert"];
type WishlistPropertyRow =
  Database["public"]["Tables"]["wishlist_properties"]["Row"];

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  propertyCount: number;
  properties?: Property[];
}

// Transform database row to frontend Wishlist type
const transformWishlistFromDB = (
  wishlist: WishlistRow,
  propertyCount: number = 0,
): Wishlist => ({
  id: wishlist.id,
  userId: wishlist.user_id,
  name: wishlist.name,
  description: wishlist.description || undefined,
  isPublic: wishlist.is_public,
  createdAt: wishlist.created_at,
  updatedAt: wishlist.updated_at,
  propertyCount,
});

export const wishlistService = {
  // Create new wishlist
  async createWishlist(wishlistData: {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Wishlist> {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .insert([
          {
            user_id: wishlistData.userId,
            name: wishlistData.name,
            description: wishlistData.description,
            is_public: wishlistData.isPublic || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return transformWishlistFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get user's wishlists
  async getUserWishlists(userId: string): Promise<Wishlist[]> {
    try {
      const { data: wishlists, error } = await supabase
        .from("wishlists")
        .select(
          `
          *,
          wishlist_properties (count)
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        wishlists?.map((wishlist) =>
          transformWishlistFromDB(
            wishlist,
            wishlist.wishlist_properties?.length || 0,
          ),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get wishlist by ID with properties
  async getWishlistById(
    id: string,
    includeProperties: boolean = true,
  ): Promise<Wishlist | null> {
    try {
      const { data: wishlist, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      let properties: Property[] = [];
      let propertyCount = 0;

      if (includeProperties) {
        const { data: wishlistProperties, error: propsError } = await supabase
          .from("wishlist_properties")
          .select(
            `
            property_id,
            properties (
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
            )
          `,
          )
          .eq("wishlist_id", id);

        if (propsError) throw propsError;

        properties =
          wishlistProperties?.map((wp) =>
            propertyService.transformPropertyFromDB(
              wp.properties,
              wp.properties?.users,
            ),
          ) || [];

        propertyCount = properties.length;
      } else {
        // Just get count
        const { data: count } = await supabase
          .from("wishlist_properties")
          .select("id", { count: "exact" })
          .eq("wishlist_id", id);

        propertyCount = count?.length || 0;
      }

      const result = transformWishlistFromDB(wishlist, propertyCount);
      if (includeProperties) {
        result.properties = properties;
      }

      return result;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Add property to wishlist
  async addPropertyToWishlist(
    wishlistId: string,
    propertyId: string,
  ): Promise<boolean> {
    try {
      // Check if property is already in wishlist
      const { data: existing } = await supabase
        .from("wishlist_properties")
        .select("id")
        .eq("wishlist_id", wishlistId)
        .eq("property_id", propertyId)
        .single();

      if (existing) {
        return true; // Already exists
      }

      const { error } = await supabase.from("wishlist_properties").insert([
        {
          wishlist_id: wishlistId,
          property_id: propertyId,
        },
      ]);

      if (error) throw error;

      // Update wishlist updated_at timestamp
      await supabase
        .from("wishlists")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", wishlistId);

      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Remove property from wishlist
  async removePropertyFromWishlist(
    wishlistId: string,
    propertyId: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("wishlist_properties")
        .delete()
        .eq("wishlist_id", wishlistId)
        .eq("property_id", propertyId);

      if (error) throw error;

      // Update wishlist updated_at timestamp
      await supabase
        .from("wishlists")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", wishlistId);

      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Check if property is in user's wishlist
  async isPropertyInWishlist(
    userId: string,
    propertyId: string,
  ): Promise<{
    isInWishlist: boolean;
    wishlistId?: string;
    wishlistName?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("wishlist_properties")
        .select(
          `
          wishlist_id,
          wishlists!inner (
            id,
            name,
            user_id
          )
        `,
        )
        .eq("property_id", propertyId)
        .eq("wishlists.user_id", userId)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const wishlistProperty = data[0];
        return {
          isInWishlist: true,
          wishlistId: wishlistProperty.wishlist_id,
          wishlistName: wishlistProperty.wishlists.name,
        };
      }

      return { isInWishlist: false };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get all wishlists containing a property
  async getWishlistsContainingProperty(
    propertyId: string,
    userId?: string,
  ): Promise<Wishlist[]> {
    try {
      let query = supabase
        .from("wishlist_properties")
        .select(
          `
          wishlists (
            *,
            users:user_id (
              id,
              first_name,
              last_name,
              avatar
            )
          )
        `,
        )
        .eq("property_id", propertyId);

      if (userId) {
        query = query.eq("wishlists.user_id", userId);
      } else {
        query = query.eq("wishlists.is_public", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map((wp) => transformWishlistFromDB(wp.wishlists)) || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update wishlist
  async updateWishlist(
    id: string,
    updateData: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    },
  ): Promise<Wishlist> {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .update({
          name: updateData.name,
          description: updateData.description,
          is_public: updateData.isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return transformWishlistFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete wishlist
  async deleteWishlist(id: string): Promise<boolean> {
    try {
      // First delete all wishlist properties
      await supabase.from("wishlist_properties").delete().eq("wishlist_id", id);

      // Then delete the wishlist
      const { error } = await supabase.from("wishlists").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get public wishlists
  async getPublicWishlists(
    page = 1,
    limit = 20,
  ): Promise<{
    wishlists: Array<Wishlist & { user: any }>;
    total: number;
  }> {
    try {
      const { count } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("wishlists")
        .select(
          `
          *,
          users:user_id (
            id,
            first_name,
            last_name,
            avatar
          ),
          wishlist_properties (count)
        `,
        )
        .eq("is_public", true)
        .range(from, to)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const wishlists =
        data?.map((wishlist) => ({
          ...transformWishlistFromDB(
            wishlist,
            wishlist.wishlist_properties?.length || 0,
          ),
          user: {
            id: wishlist.users.id,
            firstName: wishlist.users.first_name,
            lastName: wishlist.users.last_name,
            avatar: wishlist.users.avatar,
          },
        })) || [];

      return { wishlists, total: count || 0 };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Search wishlists
  async searchWishlists(query: string, userId?: string): Promise<Wishlist[]> {
    try {
      let supabaseQuery = supabase
        .from("wishlists")
        .select(
          `
          *,
          wishlist_properties (count)
        `,
        )
        .ilike("name", `%${query}%`);

      if (userId) {
        supabaseQuery = supabaseQuery.eq("user_id", userId);
      } else {
        supabaseQuery = supabaseQuery.eq("is_public", true);
      }

      const { data, error } = await supabaseQuery
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (
        data?.map((wishlist) =>
          transformWishlistFromDB(
            wishlist,
            wishlist.wishlist_properties?.length || 0,
          ),
        ) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get wishlist statistics for user
  async getWishlistStatistics(userId: string): Promise<{
    totalWishlists: number;
    totalProperties: number;
    publicWishlists: number;
    privateWishlists: number;
    averagePropertiesPerWishlist: number;
  }> {
    try {
      const { data: wishlists, error } = await supabase
        .from("wishlists")
        .select(
          `
          *,
          wishlist_properties (count)
        `,
        )
        .eq("user_id", userId);

      if (error) throw error;

      const totalWishlists = wishlists?.length || 0;
      const publicWishlists = wishlists?.filter((w) => w.is_public).length || 0;
      const privateWishlists = totalWishlists - publicWishlists;
      const totalProperties =
        wishlists?.reduce(
          (sum, w) => sum + (w.wishlist_properties?.length || 0),
          0,
        ) || 0;
      const averagePropertiesPerWishlist =
        totalWishlists > 0 ? totalProperties / totalWishlists : 0;

      return {
        totalWishlists,
        totalProperties,
        publicWishlists,
        privateWishlists,
        averagePropertiesPerWishlist,
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get trending properties in wishlists
  async getTrendingWishlistProperties(
    limit = 10,
  ): Promise<Array<Property & { wishlistCount: number }>> {
    try {
      const { data, error } = await supabase
        .from("wishlist_properties")
        .select(
          `
          property_id,
          properties (
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
          )
        `,
        )
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ) // Last 30 days
        .limit(1000);

      if (error) throw error;

      // Count properties by ID
      const propertyCount =
        data?.reduce(
          (acc, wp) => {
            acc[wp.property_id] = (acc[wp.property_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      // Get unique properties and add count
      const uniqueProperties =
        data?.reduce((acc, wp) => {
          if (!acc.some((p) => p.properties.id === wp.property_id)) {
            acc.push(wp);
          }
          return acc;
        }, [] as any[]) || [];

      const trendingProperties = uniqueProperties
        .map((wp) => ({
          ...propertyService.transformPropertyFromDB(
            wp.properties,
            wp.properties?.users,
          ),
          wishlistCount: propertyCount[wp.property_id] || 0,
        }))
        .sort((a, b) => b.wishlistCount - a.wishlistCount)
        .slice(0, limit);

      return trendingProperties;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
