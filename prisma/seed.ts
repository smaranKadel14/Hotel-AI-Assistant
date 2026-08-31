import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOTEL_SLUG = "himalayan-grand-hotel";

async function main() {
  const hotel = await prisma.hotel.upsert({
    where: { slug: HOTEL_SLUG },
    update: {
      name: "Himalayan Grand Hotel",
      address: "Thamel, Kathmandu, Nepal",
      phone: "+977-1-4200000",
      email: "info@himalayangrand.com",
    },
    create: {
      name: "Himalayan Grand Hotel",
      slug: HOTEL_SLUG,
      address: "Thamel, Kathmandu, Nepal",
      phone: "+977-1-4200000",
      email: "info@himalayangrand.com",
    },
  });

  const roomDefinitions = [
    {
      name: "Deluxe Room",
      description: "Comfortable room with a king-size bed, city views, and modern amenities.",
      priceNpr: 8500,
      capacity: 2,
    },
    {
      name: "Super Deluxe Room",
      description: "Spacious premium room with upgraded furnishings and serene views.",
      priceNpr: 11000,
      capacity: 2,
    },
    {
      name: "Executive Suite",
      description: "Elegant suite designed for business travelers with a lounge area.",
      priceNpr: 18500,
      capacity: 3,
    },
    {
      name: "Family Suite",
      description: "Generous suite with separate sleeping arrangements for families.",
      priceNpr: 22000,
      capacity: 4,
    },
    {
      name: "Presidential Suite",
      description: "Luxury suite featuring exclusive comforts and premium hospitality.",
      priceNpr: 45000,
      capacity: 2,
    },
  ];

  for (const room of roomDefinitions) {
    await prisma.room.upsert({
      where: {
        id: `${hotel.id}-room-${room.name}`,
      },
      update: {
        description: room.description,
        priceNpr: room.priceNpr,
        capacity: room.capacity,
      },
      create: {
        id: `${hotel.id}-room-${room.name}`,
        hotelId: hotel.id,
        name: room.name,
        description: room.description,
        priceNpr: room.priceNpr,
        capacity: room.capacity,
      },
    });
  }

  const facilityDefinitions = [
    "High-speed Wi-Fi",
    "Rooftop Restaurant & Bar",
    "Spa & Wellness Center",
    "Heated Swimming Pool",
    "24/7 Room Service",
    "Airport Shuttle",
    "Fitness Center",
    "Business Conference Hall",
    "Laundry Service",
  ];

  for (const facilityName of facilityDefinitions) {
    await prisma.facility.upsert({
      where: {
        id: `${hotel.id}-facility-${facilityName}`,
      },
      update: {
        name: facilityName,
      },
      create: {
        id: `${hotel.id}-facility-${facilityName}`,
        hotelId: hotel.id,
        name: facilityName,
      },
    });
  }

  const policyDefinitions = [
    {
      title: "Check-in / Check-out",
      content: "Check-in from 14:00, Check-out by 12:00 PM.",
    },
    {
      title: "Cancellation Policy",
      content: "Free cancellation up to 48 hours before check-in.",
    },
    {
      title: "Child & Extra Bed Policy",
      content: "Children under 6 stay free using existing bedding.",
    },
    {
      title: "Payment Policy",
      content: "We accept major credit cards, cash (NPR/USD), and local QR payments (eSewa/Fonepay).",
    },
  ];

  for (const policy of policyDefinitions) {
    await prisma.policy.upsert({
      where: {
        id: `${hotel.id}-policy-${policy.title}`,
      },
      update: {
        content: policy.content,
      },
      create: {
        id: `${hotel.id}-policy-${policy.title}`,
        hotelId: hotel.id,
        title: policy.title,
        content: policy.content,
      },
    });
  }

  const faqDefinitions = [
    {
      question: "Do you offer airport pick-up?",
      answer: "Yes, airport shuttle service is available upon request.",
    },
    {
      question: "Is breakfast included?",
      answer: "Standard packages include a complimentary buffet breakfast at the rooftop restaurant.",
    },
    {
      question: "Is Wi-Fi available in all rooms?",
      answer: "Yes, high-speed Wi-Fi is available across the entire property free of charge.",
    },
    {
      question: "Do you have parking space?",
      answer: "Yes, free secure parking is available for hotel guests.",
    },
    {
      question: "Are pets allowed?",
      answer: "No, pets are not allowed on the property.",
    },
    {
      question: "What currency do you accept?",
      answer: "We accept Nepalese Rupees (NPR), USD, and major international credit cards.",
    },
    {
      question: "Is hot water available 24/7?",
      answer: "Yes, 24/7 solar and electric back-up hot water is provided in all rooms.",
    },
    {
      question: "What time does the rooftop restaurant close?",
      answer: "The restaurant serves food from 6:30 AM to 10:30 PM.",
    },
    {
      question: "Do you store luggage after check-out?",
      answer: "Yes, complimentary luggage storage is available at the front desk.",
    },
    {
      question: "Can I request a late check-out?",
      answer: "Late check-out is subject to room availability and may incur an extra charge.",
    },
  ];

  for (const faq of faqDefinitions) {
    await prisma.faq.upsert({
      where: {
        id: `${hotel.id}-faq-${faq.question}`,
      },
      update: {
        answer: faq.answer,
      },
      create: {
        id: `${hotel.id}-faq-${faq.question}`,
        hotelId: hotel.id,
        question: faq.question,
        answer: faq.answer,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
