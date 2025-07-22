import React, { createContext, useContext, useEffect, useState } from "react";
import { wishlistService, analyticsService, EVENT_TYPES } from "@/services";
import { Property, Wishlist } from "@/lib/types";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/use-toast";

interface WishlistContextType {
  wishlistItems: Property[];
  wishlists: Wishlist[];
  wishlistCount: number;
  loading: boolean;
  addToWishlist: (property: Property, wishlistId?: string) => Promise<void>;
  removeFromWishlist: (
    propertyId: string,
    wishlistId?: string,
  ) => Promise<void>;
  toggleWishlist: (property: Property) => Promise<void>;
  isInWishlist: (propertyId: string) => boolean;
  clearWishlist: (wishlistId?: string) => Promise<void>;
  createWishlist: (name: string, description?: string) => Promise<Wishlist>;
  refreshWishlists: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Property[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's wishlists when authenticated
  useEffect(() => {
    if (user) {
      refreshWishlists();
    } else {
      setWishlists([]);
      setWishlistItems([]);
    }
  }, [user]);

  const refreshWishlists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userWishlists = await wishlistService.getUserWishlists(user.id);
      setWishlists(userWishlists);

      // Get all properties from all wishlists for the main wishlist items
      const allProperties: Property[] = [];
      for (const wishlist of userWishlists) {
        const wishlistWithProperties = await wishlistService.getWishlistById(
          wishlist.id,
          true,
        );
        if (wishlistWithProperties?.properties) {
          allProperties.push(...wishlistWithProperties.properties);
        }
      }

      // Remove duplicates
      const uniqueProperties = allProperties.filter(
        (property, index, self) =>
          index === self.findIndex((p) => p.id === property.id),
      );

      setWishlistItems(uniqueProperties);
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlists",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateDefaultWishlist = async (): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    // Check if user has a default wishlist
    let defaultWishlist = wishlists.find((w) => w.name === "My Favorites");

    if (!defaultWishlist) {
      // Create default wishlist
      defaultWishlist = await createWishlist(
        "My Favorites",
        "My favorite properties",
      );
    }

    return defaultWishlist.id;
  };

  const addToWishlist = async (property: Property, wishlistId?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save properties to your wishlist",
      });
      return;
    }

    try {
      let targetWishlistId = wishlistId;

      if (!targetWishlistId) {
        targetWishlistId = await getOrCreateDefaultWishlist();
      }

      await wishlistService.addPropertyToWishlist(
        targetWishlistId,
        property.id,
      );

      // Update local state
      setWishlistItems((prev) => {
        if (prev.find((p) => p.id === property.id)) return prev;
        return [...prev, property];
      });

      // Track event
      await analyticsService.trackEvent({
        eventType: EVENT_TYPES.WISHLIST_ADD,
        userId: user.id,
        eventData: {
          property_id: property.id,
          wishlist_id: targetWishlistId,
          property_title: property.title,
        },
      });

      toast({
        title: "Added to wishlist",
        description: `${property.title} has been added to your wishlist`,
      });

      await refreshWishlists();
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to add property to wishlist",
      });
    }
  };

  const removeFromWishlist = async (
    propertyId: string,
    wishlistId?: string,
  ) => {
    if (!user) return;

    try {
      let targetWishlistId = wishlistId;

      if (!targetWishlistId) {
        // Find which wishlist contains this property
        for (const wishlist of wishlists) {
          const wishlistDetails = await wishlistService.getWishlistById(
            wishlist.id,
            true,
          );
          if (wishlistDetails?.properties?.find((p) => p.id === propertyId)) {
            targetWishlistId = wishlist.id;
            break;
          }
        }
      }

      if (!targetWishlistId) {
        console.warn("Property not found in any wishlist");
        return;
      }

      await wishlistService.removePropertyFromWishlist(
        targetWishlistId,
        propertyId,
      );

      // Update local state
      setWishlistItems((prev) => prev.filter((p) => p.id !== propertyId));

      // Track event
      await analyticsService.trackEvent({
        eventType: EVENT_TYPES.WISHLIST_REMOVE,
        userId: user.id,
        eventData: {
          property_id: propertyId,
          wishlist_id: targetWishlistId,
        },
      });

      toast({
        title: "Removed from wishlist",
        description: "Property has been removed from your wishlist",
      });

      await refreshWishlists();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove property from wishlist",
      });
    }
  };

  const toggleWishlist = async (property: Property) => {
    if (isInWishlist(property.id)) {
      await removeFromWishlist(property.id);
    } else {
      await addToWishlist(property);
    }
  };

  const isInWishlist = (propertyId: string): boolean => {
    return wishlistItems.some((item) => item.id === propertyId);
  };

  const clearWishlist = async (wishlistId?: string) => {
    if (!user) return;

    try {
      if (wishlistId) {
        // Clear specific wishlist
        const wishlistDetails = await wishlistService.getWishlistById(
          wishlistId,
          true,
        );
        if (wishlistDetails?.properties) {
          for (const property of wishlistDetails.properties) {
            await wishlistService.removePropertyFromWishlist(
              wishlistId,
              property.id,
            );
          }
        }
      } else {
        // Clear all wishlists
        for (const wishlist of wishlists) {
          const wishlistDetails = await wishlistService.getWishlistById(
            wishlist.id,
            true,
          );
          if (wishlistDetails?.properties) {
            for (const property of wishlistDetails.properties) {
              await wishlistService.removePropertyFromWishlist(
                wishlist.id,
                property.id,
              );
            }
          }
        }
      }

      await refreshWishlists();

      toast({
        title: "Wishlist cleared",
        description: "All items have been removed from your wishlist",
      });
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to clear wishlist",
      });
    }
  };

  const createWishlist = async (
    name: string,
    description?: string,
  ): Promise<Wishlist> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newWishlist = await wishlistService.createWishlist({
        userId: user.id,
        name,
        description,
        isPublic: false,
      });

      setWishlists((prev) => [...prev, newWishlist]);

      toast({
        title: "Wishlist created",
        description: `${name} has been created`,
      });

      return newWishlist;
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to create wishlist",
      });
      throw error;
    }
  };

  const value: WishlistContextType = {
    wishlistItems,
    wishlists,
    wishlistCount: wishlistItems.length,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    createWishlist,
    refreshWishlists,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
