# R.O.P.S. - Rail Optimization and Planning System

## Overview

R.O.P.S. (Rail Optimization and Planning System) is a comprehensive full-stack web application designed for railway fleet management and optimization. The system provides tools for managing train data feeds, configuring optimization rules, running simulations, and tracking historical performance. It features a modern React frontend with an integrated Express server and Django backend for comprehensive railway operations management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: React Router 6 in SPA mode for client-side navigation
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS 3 with Radix UI components for consistent design system
- **State Management**: React Query (TanStack Query) for server state management
- **Theme Support**: Dark/light mode switching with next-themes

### Backend Architecture
- **Primary Backend**: Express.js server integrated with Vite development server
- **Secondary Backend**: Django REST framework for advanced data operations
- **API Strategy**: RESTful APIs with Express handling lightweight operations and Django managing complex data models
- **Development Integration**: Express server runs as Vite middleware during development
- **Production Setup**: Separate build processes for client SPA and server-side rendering

### Data Management
- **Database**: Django ORM with models for Train fleet management
- **Data Ingestion**: CSV import functionality for bulk data operations
- **API Layer**: Django REST framework for CRUD operations on train data
- **Type Safety**: Shared TypeScript interfaces between client and server

### Authentication & Authorization
- **Authentication**: Django session-based authentication for staff users
- **Authorization**: Role-based access control with staff-only restrictions
- **Session Management**: Django handles user sessions with CORS support for frontend integration

### UI/UX Design System
- **Component Library**: Radix UI primitives with custom TailwindCSS styling
- **Design Tokens**: HSL-based color system with CSS custom properties
- **Responsive Design**: Mobile-first approach with TailwindCSS breakpoints
- **Accessibility**: Radix UI ensures WCAG compliance and keyboard navigation

### Development Workflow
- **Package Manager**: PNPM for efficient dependency management
- **TypeScript**: Strict typing disabled for rapid prototyping while maintaining type hints
- **Testing**: Vitest for unit testing with React Testing Library integration
- **Code Quality**: Prettier for code formatting with consistent style rules

### Deployment Architecture
- **Build Strategy**: Separate builds for SPA client and Node.js server
- **Static Assets**: Client SPA served as static files in production
- **API Routing**: Express handles API routes while serving SPA for all other routes
- **Environment Configuration**: Dotenv for environment variable management

## External Dependencies

### UI Framework Dependencies
- **Radix UI**: Complete set of unstyled, accessible UI primitives
- **TailwindCSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography
- **next-themes**: Theme switching functionality

### Backend Framework Dependencies
- **Express.js**: Web application framework for Node.js server
- **Django**: Python web framework for complex data operations
- **Django REST Framework**: Toolkit for building Web APIs
- **CORS**: Cross-origin resource sharing support

### Development & Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking for JavaScript
- **Vitest**: Unit testing framework
- **React Query**: Server state management and caching

### Data & Validation
- **Zod**: TypeScript-first schema declaration and validation
- **React Hook Form**: Performant forms with easy validation
- **CSV Parsing**: Custom CSV parser for data ingestion

### Deployment & Infrastructure
- **Node.js**: Runtime for Express server
- **Python/Django**: Backend runtime for complex operations
- **Netlify Functions**: Serverless deployment option
- **Static File Serving**: Express static middleware for SPA delivery