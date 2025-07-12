# PoolPay - Smart Money Pooling Application

## Overview

PoolPay is a full-stack web application that enables groups of people to pool money together and take turns receiving payouts each month in a fair, organized rotation. Users can create pools, invite friends, make payments, and manage their pooling activities through a modern web interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **Build Tool**: Vite for development and bundling
- **UI Components**: Custom component library with shadcn/ui patterns

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for database operations
- **Authentication**: Session-based authentication with PostgreSQL session store
- **Payment Processing**: Stripe integration for handling payments

### Database Design
- **Schema**: Relational database with tables for users, pools, pool members, payments, payouts, messages, and invitations
- **Sessions**: Dedicated session storage table for authentication
- **Validation**: Zod schemas for runtime type validation

## Key Components

### Authentication System
- Session-based authentication using express-session
- PostgreSQL session store with connect-pg-simple
- Demo login system that accepts email addresses
- User management with upsert operations

### Pool Management
- Create and manage money pools with monthly amounts
- Add/remove members with position tracking
- Round-based payout system
- Admin controls for pool settings

### Payment System
- Stripe integration for processing payments
- Payment tracking and status management
- Payout distribution to pool members

### Communication Features
- In-pool messaging system
- Invitation system for adding new members
- Real-time updates through query invalidation

## Data Flow

1. **User Authentication**: Users authenticate via demo login, session stored in PostgreSQL
2. **Pool Creation**: Authenticated users create pools with monthly amounts and start dates
3. **Member Management**: Pool admins invite members via email, members join pools
4. **Payment Processing**: Members make monthly payments through Stripe integration
5. **Payout Distribution**: System manages round-based payouts to pool members
6. **Communication**: Users can send messages within pools and receive notifications

## External Dependencies

### Payment Processing
- **Stripe**: Handles payment processing, customer management, and payment intents
- **Integration**: Server-side Stripe SDK for secure payment handling

### Database
- **Neon**: Serverless PostgreSQL database provider
- **Connection**: Pool-based connections with WebSocket support

### UI/UX Libraries
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Server state management and caching

## Deployment Strategy

### Development Environment
- Vite development server for frontend
- Express server for backend API
- Environment variables for database and Stripe configuration

### Production Considerations
- Session configuration with trust proxy settings
- CORS middleware for cross-origin requests
- Error handling and logging
- Environment-based configuration (development vs production)

### Database Migrations
- Drizzle ORM handles schema management
- Shared schema definitions between client and server
- Type-safe database operations

### Security Features
- Session-based authentication with secure cookies
- Input validation using Zod schemas
- CORS protection
- SQL injection prevention through parameterized queries

## Recent Changes

### July 11, 2025 - Application Deployment Success
- Fixed frontend import path resolution issues by converting `@/` aliases to relative paths
- Successfully deployed both backend (port 5000) and frontend (port 3000) servers
- Resolved React import issues across all components
- Created missing utility functions and UI components
- Application is now fully functional with all core features working

## Notes

- The application uses a demo authentication system that creates users based on email addresses
- Stripe integration is optional and controlled via environment variables
- The database schema supports complex pooling logic with member positions and round tracking
- Real-time features are implemented through query invalidation rather than WebSockets
- The application follows a modern full-stack TypeScript architecture with shared types
- Both servers are running: backend on port 5000, frontend on port 3000