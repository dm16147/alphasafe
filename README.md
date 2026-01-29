# AlphaSafe - Security Equipment Management

Production-ready serverless application for managing clients, interventions, and technicians.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Hono (serverless), Jose (JWT), PostgreSQL, Drizzle ORM
- **Deployment**: Vercel (serverless functions + static hosting)

## Architecture

```bb
├── api/              # Hono serverless API (Vercel Functions)
├── client/           # React SPA
├── server/           # Server utilities & dev server
│   ├── auth/        # JWT auth logic
│   ├── db.ts        # Database connection
│   ├── storage.ts   # Data access layer
│   ├── dev.ts       # Local dev server
│   └── seed.ts      # Database seeding
└── shared/          # Shared types & schemas
```

## Development

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:seed

# Start dev servers (API + Client with HMR)
npm run dev

# Type check
npm run check

# Build for production
npm run build
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=min-32-chars-random-string
NODE_ENV=development
PORT=5000
```

## Deployment (Vercel)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

Build settings:

- Build Command: `npm run build`
- Output Directory: `dist/public`
- Node Version: 23.x

## API Routes

All routes under `/api/*`:

- `POST /api/auth/login` - JWT authentication
- `GET /api/auth/user` - Get current user
- `GET /api/clients` - List clients
- `POST /api/interventions` - Create intervention
- `GET /api/technicians` - List technicians
- `GET /api/users` - User management (admin only)

## Security

- JWT tokens in httpOnly cookies (7-day expiry)
- HS256 algorithm with SESSION_SECRET
- Bcrypt password hashing (10 rounds)
- Type-safe validation with Zod
- CORS protection via sameSite cookies

## Database Schema

- **users** - Auth & user management
- **clients** - Customer records (NIF, contacts)
- **interventions** - Service records (equipment, status, photos)
- **technicians** - Team members with notification preferences
- **photos** - Intervention attachments

Status flow: "A fazer" → "Em curso" → "A faturar" → "Concluído" (+ "Assistência")
