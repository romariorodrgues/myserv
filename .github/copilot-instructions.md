# MyServ - Instructions

## Project Overview
MyServ is a service marketplace platform that connects service providers with clients through location-based search and appointment scheduling. The system is inspired by GetNinjas and includes modern UI/UX patterns.

## Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js with Express API
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: MercadoPago and Pagar.me integration
- **Notifications**: ChatPro API for WhatsApp notifications
- **Maps**: Google Maps API for geolocation

## Key Features
- User registration (Clients and Service Providers)
- Geolocation-based search
- Appointment scheduling with calendar integration
- Payment processing with multiple gateways
- Rating and review system
- Admin dashboard for management
- Real-time notifications via WhatsApp

## Coding Standards
- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Implement responsive design with Tailwind CSS
- Use clean architecture with separation of concerns
- Include proper error handling and validation
- Add comprehensive comments and documentation

## API Integration Guidelines
- Implement proper error handling for all external APIs
- Use environment variables for all API keys and secrets
- Create typed interfaces for all API responses
- Implement retry logic for critical operations
- Log all API interactions for debugging

## Security Considerations
- Validate all user inputs
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Sanitize data before database operations
- Implement rate limiting for API endpoints
