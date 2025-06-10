import { supabase, handleSupabaseError } from "../lib/supabase";
import type { Message } from "../lib/types";
import type { Database } from "../lib/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

// Transform database row to frontend Message type
const transformMessageFromDB = (message: MessageRow): Message => ({
  id: message.id,
  senderId: message.sender_id,
  receiverId: message.receiver_id,
  bookingId: message.booking_id || undefined,
  content: message.content,
  timestamp: message.created_at,
  read: message.read,
});

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  bookingId?: string;
}

export const messageService = {
  // Send a new message
  async sendMessage(messageData: {
    senderId: string;
    receiverId: string;
    content: string;
    bookingId?: string;
    messageType?: "text" | "image" | "booking_request" | "system";
  }): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: messageData.senderId,
            receiver_id: messageData.receiverId,
            content: messageData.content,
            booking_id: messageData.bookingId,
            message_type: messageData.messageType || "text",
            read: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return transformMessageFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get conversation between two users
  async getConversation(
    userId1: string,
    userId2: string,
    bookingId?: string,
    page = 1,
    limit = 50,
  ): Promise<Message[]> {
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
        );

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data?.map(transformMessageFromDB).reverse() || [];
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get all conversations for a user
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            avatar
          ),
          receiver:receiver_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!messages || messages.length === 0) return [];

      // Group messages by conversation (other user + booking)
      const conversationMap = new Map<
        string,
        {
          otherUser: any;
          messages: any[];
          bookingId?: string;
        }
      >();

      messages.forEach((message) => {
        const otherUserId =
          message.sender_id === userId
            ? message.receiver_id
            : message.sender_id;
        const otherUser =
          message.sender_id === userId ? message.receiver : message.sender;
        const conversationKey = `${otherUserId}_${message.booking_id || "general"}`;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            otherUser,
            messages: [],
            bookingId: message.booking_id || undefined,
          });
        }

        conversationMap.get(conversationKey)!.messages.push(message);
      });

      // Convert to Conversation objects
      const conversations: Conversation[] = [];

      for (const [key, conv] of conversationMap) {
        const lastMessage = conv.messages[0]; // Most recent message (already sorted)
        const unreadCount = conv.messages.filter(
          (m) => m.receiver_id === userId && !m.read,
        ).length;

        conversations.push({
          id: key,
          otherUser: {
            id: conv.otherUser.id,
            firstName: conv.otherUser.first_name,
            lastName: conv.otherUser.last_name,
            avatar: conv.otherUser.avatar,
          },
          lastMessage: transformMessageFromDB(lastMessage),
          unreadCount,
          bookingId: conv.bookingId,
        });
      }

      // Sort by last message timestamp
      return conversations.sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp).getTime() -
          new Date(a.lastMessage.timestamp).getTime(),
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Mark messages as read
  async markMessagesAsRead(
    userId: string,
    otherUserId: string,
    bookingId?: string,
  ): Promise<void> {
    try {
      let query = supabase
        .from("messages")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("receiver_id", userId)
        .eq("sender_id", otherUserId)
        .eq("read", false);

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      } else {
        query = query.is("booking_id", null);
      }

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get unread message count for a user
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("receiver_id", userId)
        .eq("read", false);

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      // Only allow deletion if user is the sender
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Send system message (for booking updates, etc.)
  async sendSystemMessage(
    receiverId: string,
    content: string,
    bookingId?: string,
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: "system",
            receiver_id: receiverId,
            content,
            booking_id: bookingId,
            message_type: "system",
            read: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return transformMessageFromDB(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Subscribe to real-time messages for a conversation
  subscribeToConversation(
    userId1: string,
    userId2: string,
    callback: (message: Message) => void,
    bookingId?: string,
  ) {
    let channel = supabase.channel(`conversation_${userId1}_${userId2}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `or(and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1}))`,
      },
      (payload) => {
        const message = transformMessageFromDB(payload.new as MessageRow);
        callback(message);
      },
    );

    if (bookingId) {
      channel = channel.filter("booking_id", "eq", bookingId);
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe to real-time updates for user's conversations
  subscribeToUserMessages(
    userId: string,
    callback: (message: Message) => void,
  ) {
    const channel = supabase
      .channel(`user_messages_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const message = transformMessageFromDB(payload.new as MessageRow);
          callback(message);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Search messages
  async searchMessages(
    userId: string,
    query: string,
    limit = 20,
  ): Promise<Array<Message & { otherUser: any }>> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            avatar
          ),
          receiver:receiver_id (
            id,
            first_name,
            last_name,
            avatar
          )
        `,
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((message) => {
          const otherUser =
            message.sender_id === userId ? message.receiver : message.sender;
          return {
            ...transformMessageFromDB(message),
            otherUser: {
              id: otherUser.id,
              firstName: otherUser.first_name,
              lastName: otherUser.last_name,
              avatar: otherUser.avatar,
            },
          };
        }) || []
      );
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get message statistics for admin
  async getMessageStatistics(): Promise<{
    totalMessages: number;
    messagesToday: number;
    activeConversations: number;
    averageResponseTime: number;
  }> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Total messages
      const { data: allMessages, error: allError } = await supabase
        .from("messages")
        .select("created_at");

      if (allError) throw allError;

      const totalMessages = allMessages?.length || 0;
      const messagesToday =
        allMessages?.filter((m) => m.created_at.startsWith(today)).length || 0;

      // Active conversations (conversations with messages in last 7 days)
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data: recentMessages } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, booking_id")
        .gte("created_at", weekAgo);

      const activeConversations =
        new Set(
          recentMessages?.map(
            (m) =>
              `${Math.min(m.sender_id, m.receiver_id)}_${Math.max(m.sender_id, m.receiver_id)}_${m.booking_id || "general"}`,
          ),
        ).size || 0;

      return {
        totalMessages,
        messagesToday,
        activeConversations,
        averageResponseTime: 0, // Would need more complex calculation
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
};
