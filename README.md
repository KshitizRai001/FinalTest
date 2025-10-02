# R.O.P.S. - Rail Optimization and Planning System

A production-ready full-stack React application for railway fleet management and optimization, featuring Supabase backend, Netlify deployment, and modern tooling.

## 🚀 Quick Start

### For Development

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd <your-repo-name>
pnpm install
```

2. **Set up Supabase:**
```bash
node setup-supabase.js
```
Follow the prompts to configure your Supabase credentials.

3. **Run the development server:**
```bash
pnpm dev
```

### For Production Deployment

Follow the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions to deploy to Netlify with Supabase.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Netlify Functions (serverless)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify with automatic deployments

## 📁 Project Structure

```
client/                   # React SPA frontend
├── pages/                # Route components
├── components/           # Reusable UI components
├── lib/                  # Utilities and API clients
├── contexts/             # React contexts (Auth, etc.)
└── config/               # Configuration files

server/                   # Express API (for Netlify Functions)
├── routes/               # API route handlers
└── index.ts              # Server setup

netlify/                  # Netlify-specific files
└── functions/            # Serverless functions

shared/                   # Shared types and utilities
└── api.ts                # API type definitions
```

## 🔧 Key Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **CSV Data Import**: Upload and process CSV files for fleet data
- **ML Model Training**: Train machine learning models on uploaded data
- **Real-time Dashboard**: Monitor fleet status and metrics
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: User preference-based theming

## 🛠️ Development Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server (local)
pnpm typecheck  # TypeScript validation
pnpm test       # Run tests
```

## 📊 Database Schema

The application uses the following main tables:
- `trains` - Fleet vehicle information
- `csv_data_sources` - Data source definitions
- `csv_uploads` - Upload metadata
- `csv_data_rows` - Actual CSV data
- `ml_models` - Machine learning model definitions
- `ml_training_sessions` - Training session records

See `supabase-migrations.sql` for the complete schema.

## 🔐 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

This application is designed for deployment on:
- **Frontend**: Netlify (with automatic deployments from Git)
- **Backend**: Netlify Functions (serverless)
- **Database**: Supabase (managed PostgreSQL)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software for Kochi Metro Rail Limited.

## 🆘 Support

For deployment help or technical issues:
1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Review the troubleshooting section
3. Create an issue in this repository