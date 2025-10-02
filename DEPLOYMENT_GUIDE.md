# Deployment Guide: Netlify + Supabase

This guide will walk you through deploying your R.O.P.S. application to Netlify with Supabase as the database backend.

## Prerequisites

Before starting, make sure you have:
- A GitHub account (to connect your repository)
- A Netlify account (free tier is sufficient)
- A Supabase account (free tier is sufficient)

## Step 1: Set up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `rops-production` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the region closest to your users
6. Click "Create new project"
7. Wait for the project to be created (this takes a few minutes)

### 1.2 Configure Database Tables

1. Once your project is ready, go to the **SQL Editor** in the Supabase dashboard
2. Copy the contents of `supabase-migrations-clean.sql` from your project root (this version avoids permission issues)
3. Paste it into the SQL Editor and click "Run"
4. This will create all the necessary tables and security policies

**Note**: If you encounter any permission errors, use `supabase-migrations-clean.sql` instead of the regular version.

### 1.3 Get Your Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values (you'll need them later):
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 2: Prepare Your Code for Deployment
 
### 2.1 Create Environment Variables File

1. In your project root, create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit this file to Git. It's already in `.gitignore`.

### 2.2 Test Locally

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Test the application:
   - Try creating an account
   - Try logging in
   - Try uploading a CSV file
   - Make sure everything works with Supabase

## Step 3: Deploy to Netlify

### 3.1 Push Code to GitHub

1. Make sure all your changes are committed:
```bash
git add .
git commit -m "Migrate to Supabase and prepare for Netlify deployment"
git push origin main
```

### 3.2 Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select your repository from the list
6. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `pnpm run build:client`
   - **Publish directory**: `dist/spa`
   - **Functions directory**: `netlify/functions`

### 3.3 Set Environment Variables

1. In your Netlify site dashboard, go to **Site settings** → **Environment variables**
2. Add the following variables:
   - **VITE_SUPABASE_URL**: Your Supabase project URL
   - **VITE_SUPABASE_ANON_KEY**: Your Supabase anon key

### 3.4 Deploy

1. Click "Deploy site"
2. Wait for the deployment to complete (usually 2-3 minutes)
3. Your site will be available at a URL like `https://amazing-name-123456.netlify.app`

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Enter your domain name (e.g., `rops.yourcompany.com`)
4. Follow the DNS configuration instructions

### 4.2 Enable HTTPS

1. Netlify automatically provides SSL certificates
2. Make sure "Force HTTPS" is enabled in **Site settings** → **Domain management**

## Step 5: Configure Supabase Authentication

### 5.1 Set Site URL

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your Netlify site URL to **Site URL**: `https://your-site-name.netlify.app`
3. Add the same URL to **Redirect URLs**

### 5.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation and password reset email templates
3. Update the redirect URLs to point to your Netlify site

## Step 6: Test Production Deployment

### 6.1 Test Core Functionality

1. Visit your deployed site
2. Test user registration:
   - Create a new account
   - Check your email for confirmation
   - Confirm your account
3. Test login/logout
4. Test CSV upload functionality
5. Test all navigation and features

### 6.2 Monitor Performance

1. Use Netlify Analytics to monitor site performance
2. Check Supabase dashboard for database usage
3. Monitor function logs in Netlify Functions tab

## Step 7: Ongoing Maintenance

### 7.1 Automatic Deployments

- Your site will automatically redeploy when you push changes to the main branch
- You can also trigger manual deployments from the Netlify dashboard

### 7.2 Database Backups

- Supabase automatically backs up your database
- You can also create manual backups from the Supabase dashboard

### 7.3 Monitoring

- Set up Netlify notifications for deployment failures
- Monitor Supabase usage to avoid hitting free tier limits

## Troubleshooting

### Common Issues

1. **Build fails with "pnpm not found"**
   - Solution: Netlify should auto-detect pnpm. If not, add `NPM_FLAGS = "--version"` to environment variables

2. **Functions not working**
   - Check that `netlify/functions` directory exists
   - Verify environment variables are set correctly
   - Check function logs in Netlify dashboard

3. **Authentication not working**
   - Verify Supabase URL configuration
   - Check that Site URL is set correctly in Supabase
   - Ensure environment variables are set in Netlify

4. **CSV upload fails**
   - Check Netlify function logs
   - Verify Supabase connection
   - Check RLS policies in Supabase

### Getting Help

- **Netlify Support**: [https://docs.netlify.com](https://docs.netlify.com)
- **Supabase Support**: [https://supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: Create an issue in your repository

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to Git
2. **RLS Policies**: Supabase Row Level Security is enabled to protect user data
3. **HTTPS**: Always use HTTPS in production (Netlify provides this automatically)
4. **CORS**: Configure CORS properly for your domain

## Performance Optimization

1. **CDN**: Netlify provides global CDN automatically
2. **Caching**: Static assets are cached automatically
3. **Database**: Use Supabase connection pooling for better performance
4. **Functions**: Keep Netlify Functions lightweight for faster cold starts

---

## Summary

After following this guide, you will have:

✅ A Supabase database with all necessary tables and security policies  
✅ A Netlify-hosted React application with serverless functions  
✅ Secure authentication using Supabase Auth  
✅ Automatic deployments from your Git repository  
✅ HTTPS enabled with automatic SSL certificates  
✅ A scalable, production-ready application  

Your R.O.P.S. application is now ready for production use!