# AlphaSafe - Security Equipment Management System

## Overview

AlphaSafe is an internal web application for an electronic security company (empresa de segurança eletrónica) to manage clients, equipment, and technical interventions/repairs. The system replaces and improves upon a previous workflow, enabling administrative and technical staff to:

- Manage client records with NIF (Portuguese tax ID) lookup
- Register and track equipment breakdowns and service calls
- Assign technicians to interventions with email notifications
- Employee management system with granular notification preferences (Assignment, Assistance, Billing)
- Assign technicians to interventions
- Track work status through completion and billing
- Maintain history with dates, photos, and notes

This is an internal tool, not a public-facing application.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with HMR support
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture

- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API with Zod validation
- **Route Definitions**: Centralized in `shared/routes.ts` with typed schemas

### Data Storage

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with typed schemas
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command

### Autenticação e Utilizadores

- **Sistema**: Login personalizado com e-mail e password (Passport.js Local Strategy)
- **Segurança**: Hashing de passwords com `bcryptjs` (10 rounds)
- **Sessões**: Armazenadas em PostgreSQL via `connect-pg-simple`
- **Perfis**:
  - `admin` (Administração): Acesso total e gestão
  - `technician` (Técnico): Atribuição de intervenções
- **Interface**: Página de login temática AlphaSafe (#1a1612 e #c4a57b)

### Core Data Models

1. **Users**: Registos de acesso com e-mail, password (hash), nome e cargo
2. **Clients**: Company/individual records with NIF, address, contact info
3. **Interventions**: Service records linking to clients with equipment details, status tracking, technician assignment
4. **Photos**: Image attachments for interventions
5. **Technicians**: Team member registry

### Status Workflow

Interventions follow this status flow: "A fazer" → "Em curso" → "A faturar" → "Concluído" (with "Assistência" for support cases)

### Service Types

The system handles: Videovigilância, Videoporteiro, Alarme, Domótica, Controlo de acessos, Sistemas de Segurança Contra Incêndios

## External Dependencies

### Database

- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling with `pg` package
- Session storage with `connect-pg-simple`

### UI Component Library

- shadcn/ui (New York style variant)
- Radix UI primitives for accessibility
- Tailwind CSS for styling

### Key Runtime Dependencies

- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Server state management
- `react-hook-form` / `@hookform/resolvers`: Form handling with Zod integration
- `date-fns`: Date formatting and manipulation
- `zod`: Runtime type validation for API inputs/outputs

### Build & Development

- Vite for frontend bundling
- esbuild for server bundling (production)
- tsx for development server
