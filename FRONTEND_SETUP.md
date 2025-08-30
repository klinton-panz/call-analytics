# 🚀 Call Analytics Frontend Setup Guide

## 🎯 What We've Built

A complete React frontend with:
- ✅ User authentication (signup/login)
- ✅ Protected routes
- ✅ User-specific call analytics
- ✅ Modern, responsive design
- ✅ Supabase integration

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Supabase project** set up
3. **Backend API** running (your existing server)

## 🔧 Step 1: Install Dependencies

```bash
npm install
```

This will install:
- React 18
- React Router
- Supabase client
- Vite build tool

## 🔑 Step 2: Configure Supabase

1. **Go to your Supabase dashboard**
2. **Copy your project URL and anon key**
3. **Update your `.env` file:**

```env
# Backend (existing)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=8080

# Frontend (new)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

## 🗄️ Step 3: Update Database Schema

**Your existing schema needs user authentication tables. Run this in Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth.users table (if not exists)
-- Supabase usually creates this automatically

-- Update your existing calls table to include user_id
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls" ON calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls" ON calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls" ON calls
  FOR UPDATE USING (auth.uid() = user_id);
```

## 🚀 Step 4: Start the Frontend

```bash
npm run dev:frontend
```

**Your React app will run on:** `http://localhost:3000`

## 🌐 Step 5: Test the App

1. **Open** `http://localhost:3000`
2. **Sign up** with a new account
3. **Sign in** and see your dashboard
4. **Each user sees only their own calls**

## 📱 Features

### Authentication
- **Sign Up**: Email + password + name
- **Sign In**: Email + password
- **Protected Routes**: Users can only access their data
- **Session Management**: Automatic login/logout

### Dashboard
- **Personal Stats**: Total calls, monthly calls, qualified leads
- **Call Table**: Searchable, filterable call history
- **Responsive Design**: Works on mobile and desktop
- **Real-time Data**: Fetches from your Supabase database

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only see their own data
- **Protected API Routes**: Frontend routes require authentication
- **Secure Authentication**: Supabase handles auth securely
- **Input Validation**: Form validation and sanitization

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Option 2: Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Option 3: GitHub Pages
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
npm run dev:frontend
```

### Supabase connection issues
- Check your environment variables
- Verify Supabase project is active
- Check browser console for errors

### Authentication not working
- Ensure RLS policies are set up
- Check Supabase auth settings
- Verify email confirmation is enabled

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.jsx          # Sign in form
│   ├── SignUp.jsx         # Registration form
│   ├── Dashboard.jsx      # Main dashboard
│   ├── Navbar.jsx         # Navigation bar
│   └── *.css              # Component styles
├── App.jsx                # Main app with routing
├── main.jsx               # React entry point
└── index.css              # Global styles

supabase.js                 # Supabase client & helpers
vite.config.js             # Build configuration
```

## 🎉 Next Steps

1. **Customize the design** - Update colors, fonts, layout
2. **Add more features** - Call creation, editing, deletion
3. **Deploy to production** - Choose a hosting platform
4. **Add analytics** - Google Analytics, user tracking
5. **Mobile app** - React Native version

## 🆘 Need Help?

- Check the browser console for errors
- Verify all environment variables are set
- Ensure Supabase project is properly configured
- Check that your backend API is running

---

**Your Call Analytics app now has a professional frontend with user authentication!** 🚀
