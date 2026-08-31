# Hotel AI Assistant

## Project Purpose

Hotel AI Assistant is an AI-powered guest communication system for hotels.

The initial MVP will provide:
- Hotel-specific AI conversations
- Hotel information and FAQs
- Conversation memory
- Booking inquiries
- Human handoff
- Web-based guest chat

Future integrations may include:
- WhatsApp
- Facebook
- Instagram
- Other communication channels

## Development Principles

- Keep the architecture simple.
- Build features incrementally.
- Do not implement future features unless explicitly requested.
- Use TypeScript.
- Keep business logic separate from UI components.
- Use reusable components.
- Validate data on the server.
- Never expose API keys to the frontend.
- Never commit secrets.
- Use environment variables for credentials.
- Do not hardcode hotel-specific information.
- Design hotel data so multiple hotels can eventually be supported.
- Every hotel-specific record must belong to a specific hotel.
- Never allow data from one hotel to be exposed to another hotel.

## AI Rules

The AI must:
- Use approved hotel information.
- Avoid inventing hotel information.
- Never invent room prices.
- Never claim room availability unless availability has actually been verified.
- Never claim a booking is confirmed unless the backend confirms it.
- Never invent discounts.
- Offer human assistance when information is unavailable or the request requires staff action.

## Git Rules

- Make small, meaningful commits.
- Each completed feature should have its own commit.
- Do not combine unrelated features into one commit.
- Do not commit secrets or .env files.
- Do not rewrite Git history unless explicitly requested.

## Agent Rules

Before implementing a significant feature:
1. Inspect the existing project.
2. Explain the proposed approach.
3. Make the smallest reasonable change.
4. Do not modify unrelated files.
5. Run appropriate checks after implementation.
6. Report what was changed and any issues found.