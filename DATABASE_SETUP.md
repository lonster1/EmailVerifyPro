# Database Setup Guide

## Option 1: Railway PostgreSQL (Recommended for Production)

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub (free tier available)

### Step 2: Create New Project
1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Wait for database to provision (~30 seconds)

### Step 3: Get Connection String
1. Click on the PostgreSQL service
2. Go to "Connect" tab
3. Copy the "PostgreSQL Connection URL"
4. It will look like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

### Step 4: Update Environment Variables
1. Open `.env.local`
2. Replace `DATABASE_URL` with your Railway connection string:
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

### Step 5: Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

---

## Option 2: Local PostgreSQL

### Step 1: Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: `brew install postgresql@15`
- **Linux**: `sudo apt install postgresql postgresql-contrib`

### Step 2: Start PostgreSQL
```bash
# Mac (with Homebrew)
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows - PostgreSQL starts automatically after installation
```

### Step 3: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell, create database:
CREATE DATABASE emailverifypro_dev;

# Exit psql
\q
```

### Step 4: Update Environment Variables
Update `.env.local`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/emailverifypro_dev"
```

Replace `your_password` with your PostgreSQL password.

### Step 5: Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

---

## Verify Database Connection

After setup, verify everything works:

```bash
# Check Prisma can connect
npx prisma studio
```

This should open Prisma Studio in your browser at `http://localhost:5555`

---

## Next Steps

Once database is set up, you can:

1. **Start the development server:**
```bash
npm run dev
```

2. **Test registration:**
   - Go to http://localhost:3000/register
   - Create an account
   - You should be redirected to dashboard with 100 credits

3. **Test login:**
   - Logout from dashboard
   - Go to http://localhost:3000/login
   - Login with your credentials

---

## Troubleshooting

### Connection Error
If you get "Can't reach database server":
- Check DATABASE_URL is correct
- Verify PostgreSQL is running (local) or Railway service is active
- Check firewall settings

### Migration Error
If migrations fail:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run migrations again
npx prisma migrate dev --name init
```

### "Prisma Client Not Generated"
```bash
# Regenerate Prisma Client
npx prisma generate
```

---

## Production Deployment

For production deployment to Vercel:

1. **Railway:**
   - Use Railway connection string in Vercel environment variables
   - Set `DATABASE_URL` in Vercel project settings

2. **Run Production Migration:**
```bash
# Deploy migrations to production
npx prisma migrate deploy
```

**Important:** Never run `migrate dev` in production!
