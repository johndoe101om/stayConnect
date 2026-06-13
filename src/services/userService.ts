import { apiRequest } from "../lib/apiClient";
import type { User } from "../lib/types";

const transformUser = (user: any): User => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar || undefined,
  phone: user.phone || undefined,
  isHost: Boolean(user.isHost),
  isVerified: Boolean(user.isVerified),
  joinedDate: user.joinedDate,
  rating: user.rating || undefined,
  reviewCount: user.reviewCount || 0,
  role: user.role,
});

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    if (id === "me") return this.getCurrentUser();
    try {
      const response = await apiRequest<User>(`/users/${id}`);
      return transformUser(response);
    } catch (error: any) {
      if (String(error.message).includes("404")) return null;
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiRequest<User>("/users/me");
      return transformUser(response);
    } catch (error: any) {
      if (String(error.message).includes("401")) return null;
      throw error;
    }
  },

  async getUserByEmail(_email: string): Promise<User | null> {
    return null;
  },

  async createUserProfile(userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  }): Promise<User> {
    return transformUser({
      ...userData,
      isHost: false,
      isVerified: false,
      joinedDate: new Date().toISOString(),
      reviewCount: 0,
      role: "guest",
    });
  },

  async updateUserProfile(
    _id: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      phone?: string;
      bio?: string;
      languages?: string[];
    },
  ): Promise<User> {
    const response = await apiRequest<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return transformUser(response);
  },

  async toggleHostStatus(_id: string, isHost: boolean): Promise<User> {
    const response = await apiRequest<User>("/users/me/host-status", {
      method: "PATCH",
      body: JSON.stringify(isHost),
    });
    return transformUser(response);
  },

  async verifyUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  },

  async getUserStats(userId: string): Promise<{
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
    responseRate: number;
    activeListings: number;
    totalGuests: number;
  }> {
    return apiRequest(`/users/${userId}/stats`);
  },

  async searchUsers(_query: string, _page = 1, _limit = 20): Promise<{
    users: User[];
    total: number;
  }> {
    return { users: [], total: 0 };
  },

  async getHosts(page = 1, limit = 20): Promise<{
    hosts: User[];
    total: number;
  }> {
    const response = await apiRequest<{ hosts: User[]; total: number }>(`/users/hosts?page=${page}&limit=${limit}`);
    return {
      hosts: response.hosts.map(transformUser),
      total: response.total,
    };
  },

  async updateResponseMetrics(): Promise<void> {
    return Promise.resolve();
  },

  async getUserDashboardData(_userId: string): Promise<{
    upcomingBookings: number;
    totalBookings: number;
    unreadMessages: number;
    pendingReviews: number;
    totalEarnings?: number;
    occupancyRate?: number;
  }> {
    return {
      upcomingBookings: 0,
      totalBookings: 0,
      unreadMessages: 0,
      pendingReviews: 0,
    };
  },

  async getUserActivity(): Promise<Array<{
    id: string;
    eventType: string;
    eventData: any;
    createdAt: string;
  }>> {
    return [];
  },
};
