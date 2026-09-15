export const CHANNELS = ["WEB", "WHATSAPP", "INSTAGRAM", "FACEBOOK"] as const;

export type Channel = (typeof CHANNELS)[number];

export interface IncomingMessage {
  hotelSlug?: string;
  hotelId?: string;
  conversationId?: string | null;
  channel: Channel;
  message: string;
  guestName?: string | null;
}

export interface OutgoingMessage {
  conversationId: string;
  hotelId: string;
  channel: Channel;
  reply: string;
  handoffSuggested: boolean;
  bookingInquiryCaptured: boolean;
}
