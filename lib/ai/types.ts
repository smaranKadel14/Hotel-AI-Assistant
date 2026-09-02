export type MessageRole = "user" | "assistant" | "system";

export interface HotelLocation {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
}

export interface RoomInfo {
  name: string;
  description: string;
  priceNpr: number;
  capacity: number;
}

export interface PolicyInfo {
  title: string;
  content: string;
}

export interface FaqInfo {
  question: string;
  answer: string;
}

export interface HotelContext {
  hotel: HotelLocation;
  rooms: RoomInfo[];
  facilities: string[];
  policies: PolicyInfo[];
  faqs: FaqInfo[];
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface BookingExtraction {
  bookingIntent: boolean;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  roomType: string | null;
  checkIn: string | null;
  checkOut: string | null;
}

export interface GenerateResponseInput {
  hotelContext: HotelContext | string;
  hotelName?: string;
  messages: ChatMessage[];
  userMessage: string;
  apiKey?: string;
  model?: string;
}

export interface GenerateResponseOutput {
  text: string;
  suggestedHandoff: boolean;
  bookingExtraction?: BookingExtraction | null;
}
