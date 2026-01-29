# EmailVerify Pro

Professional email verification platform at 70% lower cost than competitors.

## Project Status

✅ **Phase 1 - Week 1 (Foundation) - IN PROGRESS**

### Completed
- [x] Next.js 14+ project initialized with TypeScript
- [x] All core dependencies installed (Prisma, Tailwind, Stripe, etc.)
- [x] Prisma schema configured with all database models
- [x] Environment variables template created
- [x] Tailwind CSS configured with shadcn/ui theme
- [x] Basic app directory structure
- [x] Landing page placeholder
- [x] Development server running

### Current Status
Ready to begin Week 1 authentication development.

## Tech Stack

- **Frontend**: Next.js 14+ (React 18, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL 15+ (via Prisma ORM)
- **Cache/Queue**: Redis 7+
- **External APIs**:
  - Reoon (email verification)
  - Stripe (payments)
  - SendGrid/SES (email delivery)
- **Hosting**: Vercel (frontend) + Railway (backend/DB)

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL database (local or Railway)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Copy the example file
cp .env.example .env.local

# Update .env.local with your credentials:
# - DATABASE_URL (PostgreSQL connection string)
# - REOON_API_KEY (from https://reoon.com)
# - STRIPE_SECRET_KEY (from Stripe dashboard)
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

3. **Set up the database:**
```bash
# Create database (if using local PostgreSQL)
createdb emailverifypro_dev

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

4. **Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and run database migrations

## Project Structure

```
emailverifypro/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages (login, register)
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities and helpers
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Utility functions
│   ├── auth.ts            # Authentication utilities
│   └── reoon.ts           # Reoon API client
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static files
└── .env.local             # Environment variables
```

## Database Models

### User
- Authentication and account management
- Credit balance tracking
- Role-based access control

### Verification
- Email verification jobs (single, batch, bulk)
- Results storage with 30-day retention
- Processing status tracking

### CreditTransaction
- Credit purchase and usage history
- Stripe payment tracking
- Balance calculations

### ApiKey
- API key management
- Usage tracking
- Security (hashed storage)

### Subscription (Phase 2)
- Daily renewable credit plans
- Stripe subscription integration

## Development Roadmap

### Week 1: Foundation & Authentication ✅ IN PROGRESS
- [x] Project setup
- [ ] User registration
- [ ] User login (JWT)
- [ ] Database migrations
- [ ] Basic dashboard layout

### Week 2: Core Verification Engine
- [ ] Reoon API integration
- [ ] Single email verification
- [ ] Credit management
- [ ] Dashboard UI

### Week 3: Bulk CSV Upload & Results
- [ ] CSV upload
- [ ] Bulk processing
- [ ] Results page
- [ ] Export functionality

### Week 4: Payments & Production
- [ ] Stripe integration
- [ ] Billing page
- [ ] Production deployment
- [ ] Beta user testing

## Next Steps

**Immediate tasks (Week 1):**
1. Create authentication utilities (`/lib/auth.ts`)
2. Build registration API route (`/app/api/auth/register/route.ts`)
3. Build login API route (`/app/api/auth/login/route.ts`)
4. Create auth UI pages
5. Set up authentication middleware
6. Run database migrations on Railway

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Reoon API
REOON_API_KEY="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# JWT
JWT_SECRET="..." # min 32 chars
NEXTAUTH_SECRET="..." # min 32 chars

# Email
SENDGRID_API_KEY="..."
FROM_EMAIL="noreply@emailverifypro.com"
```

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All Rights Reserved

---

**Built with ❤️ using Next.js, TypeScript, and Prisma**
