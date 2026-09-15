import type { Channel } from "@/modules/messaging/types";

export interface ProcessMessageInput {
  hotelSlug?: string;
  hotelId?: string;
  conversationId?: string | null;
  channel: Channel;
  message: string;
  guestName?: string | null;
}

export interface ProcessMessageResult {
  conversationId: string;
  hotelId: string;
  channel: Channel;
  reply: string;
  handoffSuggested: boolean;
  bookingInquiryCaptured: boolean;
}
